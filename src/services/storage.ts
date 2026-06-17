import type { GiftRecord, YearlyBudget, MergeRecord, MergeResult, Ledger } from '@/types';
import { generateId } from '@/utils/id';

const LEDGERS_KEY = 'gift_ledger_ledgers';
const CURRENT_LEDGER_KEY = 'gift_ledger_current';
const STORAGE_VERSION = '2.0';
const MAX_MERGE_HISTORY = 10;

interface LedgerStorageData {
  records: GiftRecord[];
  budgets: YearlyBudget[];
  mergeHistory: MergeRecord[];
  version: string;
}

interface LedgersStorageData {
  ledgers: Ledger[];
  version: string;
}

function getLedgerStorageKey(ledgerId: string): string {
  return `gift_ledger_data_${ledgerId}`;
}

function getLedgersData(): LedgersStorageData {
  try {
    const raw = localStorage.getItem(LEDGERS_KEY);
    if (raw) {
      const data = JSON.parse(raw) as LedgersStorageData;
      if (data.version === STORAGE_VERSION) {
        return data;
      }
    }
  } catch (e) {
    console.error('读取账本列表失败:', e);
  }
  return { ledgers: [], version: STORAGE_VERSION };
}

function saveLedgersData(data: LedgersStorageData): void {
  try {
    localStorage.setItem(LEDGERS_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('保存账本列表失败:', e);
  }
}

function getLedgerData(ledgerId: string): LedgerStorageData {
  try {
    const raw = localStorage.getItem(getLedgerStorageKey(ledgerId));
    if (raw) {
      const data = JSON.parse(raw) as LedgerStorageData;
      return data;
    }
  } catch (e) {
    console.error('读取账本数据失败:', e);
  }
  return { records: [], budgets: [], mergeHistory: [], version: STORAGE_VERSION };
}

function saveLedgerData(ledgerId: string, data: LedgerStorageData): void {
  try {
    localStorage.setItem(getLedgerStorageKey(ledgerId), JSON.stringify(data));
  } catch (e) {
    console.error('保存账本数据失败:', e);
  }
}

export function getCurrentLedgerId(): string {
  try {
    const id = localStorage.getItem(CURRENT_LEDGER_KEY);
    if (id) return id;
  } catch (e) {
    console.error('读取当前账本失败:', e);
  }
  return '';
}

export function setCurrentLedgerId(ledgerId: string): void {
  try {
    localStorage.setItem(CURRENT_LEDGER_KEY, ledgerId);
  } catch (e) {
    console.error('保存当前账本失败:', e);
  }
}

export function getLedgers(): Ledger[] {
  const data = getLedgersData();
  return data.ledgers.sort((a, b) => 
    new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );
}

export function getLedgerById(ledgerId: string): Ledger | undefined {
  const ledgers = getLedgers();
  return ledgers.find(l => l.id === ledgerId);
}

export function createLedger(name: string, icon: string, color: string): Ledger {
  const data = getLedgersData();
  const now = new Date().toISOString();
  const newLedger: Ledger = {
    id: generateId(),
    name,
    icon,
    color,
    createdAt: now,
    updatedAt: now,
  };
  data.ledgers.push(newLedger);
  saveLedgersData(data);
  
  const emptyData: LedgerStorageData = {
    records: [],
    budgets: [],
    mergeHistory: [],
    version: STORAGE_VERSION,
  };
  saveLedgerData(newLedger.id, emptyData);
  
  return newLedger;
}

export function updateLedger(ledgerId: string, updates: Partial<Ledger>): Ledger | null {
  const data = getLedgersData();
  const index = data.ledgers.findIndex(l => l.id === ledgerId);
  if (index === -1) return null;
  
  const updatedLedger: Ledger = {
    ...data.ledgers[index],
    ...updates,
    id: ledgerId,
    updatedAt: new Date().toISOString(),
  };
  data.ledgers[index] = updatedLedger;
  saveLedgersData(data);
  return updatedLedger;
}

export function deleteLedger(ledgerId: string): boolean {
  const data = getLedgersData();
  const initialLength = data.ledgers.length;
  data.ledgers = data.ledgers.filter(l => l.id !== ledgerId);
  if (data.ledgers.length === initialLength) return false;
  
  saveLedgersData(data);
  
  try {
    localStorage.removeItem(getLedgerStorageKey(ledgerId));
  } catch (e) {
    console.error('删除账本数据失败:', e);
  }
  
  const currentId = getCurrentLedgerId();
  if (currentId === ledgerId && data.ledgers.length > 0) {
    setCurrentLedgerId(data.ledgers[0].id);
  }
  
  return true;
}

let currentLedgerId = getCurrentLedgerId();

export function setActiveLedger(ledgerId: string): void {
  currentLedgerId = ledgerId;
  setCurrentLedgerId(ledgerId);
}

export function getActiveLedgerId(): string {
  return currentLedgerId;
}

function getStorageData(): { records: GiftRecord[]; version: string } {
  const data = getLedgerData(currentLedgerId);
  return { records: data.records, version: data.version };
}

function saveStorageData(data: { records: GiftRecord[]; version: string }): void {
  const ledgerData = getLedgerData(currentLedgerId);
  ledgerData.records = data.records;
  ledgerData.version = data.version;
  saveLedgerData(currentLedgerId, ledgerData);
}

export function getBudgetStorageData(): YearlyBudget[] {
  const data = getLedgerData(currentLedgerId);
  return data.budgets;
}

export function saveBudgetStorageData(budgets: YearlyBudget[]): void {
  const ledgerData = getLedgerData(currentLedgerId);
  ledgerData.budgets = budgets;
  saveLedgerData(currentLedgerId, ledgerData);
}

export function getYearlyBudget(year: number): YearlyBudget | undefined {
  const budgets = getBudgetStorageData();
  return budgets.find(b => b.year === year);
}

export function getAllBudgets(): YearlyBudget[] {
  return getBudgetStorageData();
}

export function setYearlyBudget(year: number, budget: number): YearlyBudget {
  const budgets = getBudgetStorageData();
  const existingIndex = budgets.findIndex(b => b.year === year);
  const newBudget: YearlyBudget = { year, budget };
  
  if (existingIndex >= 0) {
    budgets[existingIndex] = newBudget;
  } else {
    budgets.push(newBudget);
  }
  
  saveBudgetStorageData(budgets);
  return newBudget;
}

export function deleteYearlyBudget(year: number): boolean {
  const budgets = getBudgetStorageData();
  const initialLength = budgets.length;
  const filtered = budgets.filter(b => b.year !== year);
  if (filtered.length === initialLength) return false;
  saveBudgetStorageData(filtered);
  return true;
}

export function getRecords(): GiftRecord[] {
  const data = getStorageData();
  return data.records
    .map(r => ({ ...r, tags: r.tags || [], imageUrls: r.imageUrls || [] }))
    .sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
}

export function getRecordById(id: string): GiftRecord | undefined {
  const records = getRecords();
  return records.find(r => r.id === id);
}

export function addRecord(record: Omit<GiftRecord, 'id' | 'createdAt' | 'updatedAt'>): GiftRecord {
  const data = getStorageData();
  const now = new Date().toISOString();
  const newRecord: GiftRecord = {
    ...record,
    tags: record.tags || [],
    imageUrls: record.imageUrls || [],
    id: generateId(),
    createdAt: now,
    updatedAt: now,
  };
  data.records.push(newRecord);
  saveStorageData(data);
  return newRecord;
}

export function updateRecord(id: string, updates: Partial<GiftRecord>): GiftRecord | null {
  const data = getStorageData();
  const index = data.records.findIndex(r => r.id === id);
  if (index === -1) return null;
  
  const updatedRecord: GiftRecord = {
    ...data.records[index],
    ...updates,
    id,
    updatedAt: new Date().toISOString(),
  };
  data.records[index] = updatedRecord;
  saveStorageData(data);
  return updatedRecord;
}

export function deleteRecord(id: string): boolean {
  const data = getStorageData();
  const initialLength = data.records.length;
  data.records = data.records.filter(r => r.id !== id);
  if (data.records.length === initialLength) return false;
  saveStorageData(data);
  return true;
}

export function getRecordsByContact(contactName: string): GiftRecord[] {
  const records = getRecords();
  return records
    .filter(r => r.contactName === contactName)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function getRecordsByYear(year: number): GiftRecord[] {
  const records = getRecords();
  return records.filter(r => new Date(r.date).getFullYear() === year);
}

export function getAvailableYears(): number[] {
  const records = getRecords();
  const years = new Set(records.map(r => new Date(r.date).getFullYear()));
  return Array.from(years).sort((a, b) => b - a);
}

export function importRecords(records: GiftRecord[]): void {
  const data = getStorageData();
  data.records = records;
  saveStorageData(data);
}

export function clearAllRecords(): void {
  saveStorageData({ records: [], version: STORAGE_VERSION });
}

export function getMergeHistory(): MergeRecord[] {
  const data = getLedgerData(currentLedgerId);
  return data.mergeHistory;
}

export function saveMergeHistory(history: MergeRecord[]): void {
  const ledgerData = getLedgerData(currentLedgerId);
  ledgerData.mergeHistory = history;
  saveLedgerData(currentLedgerId, ledgerData);
}

export function appendMergeHistory(record: MergeRecord): void {
  const history = getMergeHistory();
  history.unshift(record);
  if (history.length > MAX_MERGE_HISTORY) {
    history.length = MAX_MERGE_HISTORY;
  }
  saveMergeHistory(history);
}

export function popMergeHistory(): MergeRecord | null {
  const history = getMergeHistory();
  if (history.length === 0) return null;
  const latest = history.shift()!;
  saveMergeHistory(history);
  return latest;
}

export function getLatestMergeRecord(): MergeRecord | null {
  const history = getMergeHistory();
  return history.length > 0 ? history[0] : null;
}

export function mergeContacts(
  sourceContactNames: string[],
  targetContactName: string
): MergeResult {
  if (sourceContactNames.length === 0) {
    return { success: false, message: '请选择要合并的源联系人', updatedCount: 0 };
  }

  const allNames = [...sourceContactNames, targetContactName];
  const uniqueNames = new Set(allNames);
  if (uniqueNames.size !== allNames.length) {
    return { success: false, message: '源联系人与目标联系人不能重复', updatedCount: 0 };
  }

  const data = getStorageData();
  const modifiedRecords: MergeRecord['modifiedRecords'] = [];
  let updatedCount = 0;

  data.records = data.records.map(record => {
    if (sourceContactNames.includes(record.contactName)) {
      modifiedRecords.push({
        recordId: record.id,
        oldContactName: record.contactName,
        newContactName: targetContactName,
      });
      updatedCount++;
      return {
        ...record,
        contactName: targetContactName,
        updatedAt: new Date().toISOString(),
      };
    }
    return record;
  });

  if (updatedCount === 0) {
    return { success: false, message: '未找到需要迁移的记录', updatedCount: 0 };
  }

  saveStorageData(data);

  const mergeRecord: MergeRecord = {
    id: generateId(),
    sourceContactNames,
    targetContactName,
    modifiedRecords,
    mergedAt: new Date().toISOString(),
  };

  appendMergeHistory(mergeRecord);

  return {
    success: true,
    mergeRecord,
    message: `已成功合并 ${sourceContactNames.length} 个联系人到「${targetContactName}」，共迁移 ${updatedCount} 条记录`,
    updatedCount,
  };
}

export function undoLastMerge(): MergeResult {
  const mergeRecord = popMergeHistory();
  if (!mergeRecord) {
    return { success: false, message: '没有可撤销的合并操作', updatedCount: 0 };
  }

  const data = getStorageData();
  let restoredCount = 0;

  mergeRecord.modifiedRecords.forEach(({ recordId, oldContactName }) => {
    const idx = data.records.findIndex(r => r.id === recordId);
    if (idx !== -1) {
      data.records[idx] = {
        ...data.records[idx],
        contactName: oldContactName,
        updatedAt: new Date().toISOString(),
      };
      restoredCount++;
    }
  });

  saveStorageData(data);

  return {
    success: true,
    message: `已撤销合并，恢复 ${restoredCount} 条记录到原联系人`,
    updatedCount: restoredCount,
  };
}

export function migrateLegacyData(): void {
  const legacyKey = 'gift_ledger_records';
  const legacyBudgetKey = 'gift_ledger_budgets';
  const legacyMergeKey = 'gift_ledger_merge_history';
  
  try {
    const hasLegacyData = localStorage.getItem(legacyKey);
    if (!hasLegacyData) return;
    
    const ledgersData = getLedgersData();
    if (ledgersData.ledgers.length > 0) return;
    
    const now = new Date().toISOString();
    const defaultLedger: Ledger = {
      id: generateId(),
      name: '我的人情',
      icon: '🧧',
      color: 'from-primary-500 to-primary-700',
      createdAt: now,
      updatedAt: now,
    };
    
    ledgersData.ledgers.push(defaultLedger);
    saveLedgersData(ledgersData);
    setCurrentLedgerId(defaultLedger.id);
    currentLedgerId = defaultLedger.id;
    
    const legacyRecords = localStorage.getItem(legacyKey);
    const legacyBudgets = localStorage.getItem(legacyBudgetKey);
    const legacyMerge = localStorage.getItem(legacyMergeKey);
    
    const ledgerData: LedgerStorageData = {
      records: [],
      budgets: [],
      mergeHistory: [],
      version: STORAGE_VERSION,
    };
    
    if (legacyRecords) {
      try {
        const parsed = JSON.parse(legacyRecords);
        ledgerData.records = parsed.records || [];
      } catch (e) {
        console.error('解析旧记录数据失败:', e);
      }
    }
    
    if (legacyBudgets) {
      try {
        ledgerData.budgets = JSON.parse(legacyBudgets);
      } catch (e) {
        console.error('解析旧预算数据失败:', e);
      }
    }
    
    if (legacyMerge) {
      try {
        ledgerData.mergeHistory = JSON.parse(legacyMerge);
      } catch (e) {
        console.error('解析旧合并历史失败:', e);
      }
    }
    
    saveLedgerData(defaultLedger.id, ledgerData);
    
  } catch (e) {
    console.error('迁移旧数据失败:', e);
  }
}
