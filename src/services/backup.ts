import type { GiftRecord, YearlyBudget, MergeRecord } from '@/types';
import { 
  getRecords, 
  importRecords as storageImportRecords,
  clearAllRecords,
  getAllBudgets,
  saveBudgetStorageData,
  getMergeHistory,
  saveMergeHistory,
} from '@/services/storage';

export const BACKUP_VERSION = '1.0';
export const BACKUP_FILE_EXTENSION = '.giftbackup';

interface BackupData {
  records: GiftRecord[];
  budgets: YearlyBudget[];
  mergeHistory: MergeRecord[];
}

export interface BackupFile {
  version: string;
  timestamp: string;
  appVersion: string;
  data: BackupData;
}

export type ImportMode = 'overwrite' | 'merge';

export interface ImportResult {
  success: boolean;
  message: string;
  recordsImported?: number;
  recordsSkipped?: number;
  budgetsImported?: number;
  mode?: ImportMode;
}

export interface BackupProgress {
  phase: 'preparing' | 'encrypting' | 'downloading' | 'reading' | 'decrypting' | 'importing';
  current: number;
  total: number;
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const passwordBuffer = encoder.encode(password);
  
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    passwordBuffer,
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );
  
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );
}

async function encryptData(data: string, password: string): Promise<string> {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  
  const key = await deriveKey(password, salt);
  
  const encryptedBuffer = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv },
    key,
    dataBuffer
  );
  
  const result = new Uint8Array(salt.length + iv.length + encryptedBuffer.byteLength);
  result.set(salt, 0);
  result.set(iv, salt.length);
  result.set(new Uint8Array(encryptedBuffer), salt.length + iv.length);
  
  return arrayBufferToBase64(result.buffer);
}

async function decryptData(encryptedBase64: string, password: string): Promise<string> {
  const encryptedBuffer = base64ToArrayBuffer(encryptedBase64);
  const encryptedBytes = new Uint8Array(encryptedBuffer);
  
  const salt = encryptedBytes.slice(0, 16);
  const iv = encryptedBytes.slice(16, 28);
  const ciphertext = encryptedBytes.slice(28);
  
  const key = await deriveKey(password, salt);
  
  try {
    const decryptedBuffer = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: iv },
      key,
      ciphertext
    );
    
    const decoder = new TextDecoder();
    return decoder.decode(decryptedBuffer);
  } catch (e) {
    throw new Error('密码错误或备份文件已损坏');
  }
}

function createBackupFile(): BackupFile {
  const backupFile: BackupFile = {
    version: BACKUP_VERSION,
    timestamp: new Date().toISOString(),
    appVersion: '1.0.0',
    data: {
      records: getRecords(),
      budgets: getAllBudgets(),
      mergeHistory: getMergeHistory(),
    },
  };
  return backupFile;
}

function validateBackupFile(data: unknown): data is BackupFile {
  if (typeof data !== 'object' || data === null) return false;
  
  const backup = data as BackupFile;
  
  if (typeof backup.version !== 'string') return false;
  if (typeof backup.timestamp !== 'string') return false;
  if (typeof backup.data !== 'object' || backup.data === null) return false;
  
  if (!Array.isArray(backup.data.records)) return false;
  if (!Array.isArray(backup.data.budgets)) return false;
  if (!Array.isArray(backup.data.mergeHistory)) return false;
  
  return true;
}

export async function exportEncryptedBackup(
  password: string,
  onProgress?: (progress: BackupProgress) => void
): Promise<void> {
  onProgress?.({ phase: 'preparing', current: 0, total: 100 });
  
  const backupFile = createBackupFile();
  const jsonData = JSON.stringify(backupFile);
  
  onProgress?.({ phase: 'encrypting', current: 30, total: 100 });
  
  const encryptedData = await encryptData(jsonData, password);
  
  onProgress?.({ phase: 'downloading', current: 80, total: 100 });
  
  const blob = new Blob([encryptedData], { type: 'application/octet-stream' });
  const url = URL.createObjectURL(blob);
  
  const timestamp = new Date();
  const dateStr = timestamp.toISOString().slice(0, 10).replace(/-/g, '');
  const timeStr = timestamp.toTimeString().slice(0, 8).replace(/:/g, '');
  const filename = `gift-backup-${dateStr}-${timeStr}${BACKUP_FILE_EXTENSION}`;
  
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  
  onProgress?.({ phase: 'downloading', current: 100, total: 100 });
}

export async function readBackupFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve(reader.result as string);
    };
    reader.onerror = () => {
      reject(new Error('读取文件失败'));
    };
    reader.readAsText(file);
  });
}

export async function decryptBackup(
  encryptedData: string,
  password: string,
  onProgress?: (progress: BackupProgress) => void
): Promise<BackupFile> {
  onProgress?.({ phase: 'decrypting', current: 0, total: 100 });
  
  const decryptedJson = await decryptData(encryptedData, password);
  
  onProgress?.({ phase: 'decrypting', current: 70, total: 100 });
  
  let backupFile: BackupFile;
  try {
    backupFile = JSON.parse(decryptedJson);
  } catch (e) {
    throw new Error('备份文件格式错误');
  }
  
  if (!validateBackupFile(backupFile)) {
    throw new Error('备份文件格式无效');
  }
  
  onProgress?.({ phase: 'decrypting', current: 100, total: 100 });
  
  return backupFile;
}

function yieldToMain(): Promise<void> {
  return new Promise(resolve => requestAnimationFrame(() => resolve()));
}

export async function importBackup(
  backupFile: BackupFile,
  mode: ImportMode,
  onProgress?: (progress: BackupProgress) => void
): Promise<ImportResult> {
  onProgress?.({ phase: 'importing', current: 0, total: 100 });
  await yieldToMain();
  
  const currentRecords = getRecords();
  const currentBudgets = getAllBudgets();
  
  let recordsImported = 0;
  let recordsSkipped = 0;
  let budgetsImported = 0;
  
  if (mode === 'overwrite') {
    onProgress?.({ phase: 'importing', current: 10, total: 100 });
    await yieldToMain();
    
    clearAllRecords();
    
    onProgress?.({ phase: 'importing', current: 30, total: 100 });
    await yieldToMain();
    
    storageImportRecords(backupFile.data.records);
    
    onProgress?.({ phase: 'importing', current: 60, total: 100 });
    await yieldToMain();
    
    saveBudgetStorageData(backupFile.data.budgets);
    
    onProgress?.({ phase: 'importing', current: 80, total: 100 });
    await yieldToMain();
    
    saveMergeHistory(backupFile.data.mergeHistory);
    
    recordsImported = backupFile.data.records.length;
    budgetsImported = backupFile.data.budgets.length;
    
    onProgress?.({ phase: 'importing', current: 100, total: 100 });
    await yieldToMain();
    
    return {
      success: true,
      message: `已覆盖导入 ${recordsImported} 条记录和 ${budgetsImported} 项预算设置`,
      recordsImported,
      budgetsImported,
      mode,
    };
  } else {
    const existingRecordIds = new Set(currentRecords.map(r => r.id));
    const existingBudgetYears = new Set(currentBudgets.map(b => b.year));
    
    onProgress?.({ phase: 'importing', current: 10, total: 100 });
    await yieldToMain();
    
    const mergedRecords = [...currentRecords];
    const totalRecords = backupFile.data.records.length;
    const chunkSize = Math.max(1, Math.ceil(totalRecords / 8));
    
    for (let i = 0; i < backupFile.data.records.length; i++) {
      const record = backupFile.data.records[i];
      if (existingRecordIds.has(record.id)) {
        recordsSkipped++;
      } else {
        mergedRecords.push(record);
        recordsImported++;
      }
      
      if (i > 0 && (i % chunkSize === 0 || i === totalRecords - 1)) {
        const progress = 10 + Math.round((i + 1) / totalRecords * 60);
        onProgress?.({ phase: 'importing', current: progress, total: 100 });
        await yieldToMain();
      }
    }
    
    onProgress?.({ phase: 'importing', current: 75, total: 100 });
    await yieldToMain();
    
    const mergedBudgets = [...currentBudgets];
    for (const budget of backupFile.data.budgets) {
      if (!existingBudgetYears.has(budget.year)) {
        mergedBudgets.push(budget);
        budgetsImported++;
      }
    }
    
    onProgress?.({ phase: 'importing', current: 85, total: 100 });
    await yieldToMain();
    
    storageImportRecords(mergedRecords);
    
    onProgress?.({ phase: 'importing', current: 90, total: 100 });
    await yieldToMain();
    
    saveBudgetStorageData(mergedBudgets);
    
    const mergedMergeHistory = [
      ...backupFile.data.mergeHistory,
      ...getMergeHistory(),
    ].slice(0, 10);
    saveMergeHistory(mergedMergeHistory);
    
    onProgress?.({ phase: 'importing', current: 100, total: 100 });
    await yieldToMain();
    
    return {
      success: true,
      message: `智能合并完成：新增 ${recordsImported} 条记录，跳过 ${recordsSkipped} 条已存在记录，新增 ${budgetsImported} 项预算设置`,
      recordsImported,
      recordsSkipped,
      budgetsImported,
      mode,
    };
  }
}

export function checkLocalDataExists(): boolean {
  const records = getRecords();
  const budgets = getAllBudgets();
  return records.length > 0 || budgets.length > 0;
}

export function formatBackupTimestamp(timestamp: string): string {
  const date = new Date(timestamp);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}
