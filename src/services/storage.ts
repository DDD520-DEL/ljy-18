import type { GiftRecord, YearlyBudget, MergeRecord, MergeResult, Ledger, UserPreferences, RecordTemplate, ContactGroup } from '@/types';
import { generateId } from '@/utils/id';
import { DEFAULT_PREFERENCES, RECYCLE_BIN_DAYS } from '@/types';

const LEDGERS_KEY = 'gift_ledger_ledgers';
const CURRENT_LEDGER_KEY = 'gift_ledger_current';
const PREFERENCES_KEY = 'gift_ledger_preferences';
const STORAGE_VERSION = '2.0';
const MAX_MERGE_HISTORY = 10;

interface LedgerStorageData {
  records: GiftRecord[];
  recycleBin: GiftRecord[];
  budgets: YearlyBudget[];
  mergeHistory: MergeRecord[];
  groups: ContactGroup[];
  contactGroups: Record<string, string>;
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
      if (!data.recycleBin) {
        data.recycleBin = [];
      }
      if (!data.groups) {
        data.groups = [];
      }
      if (!data.contactGroups) {
        data.contactGroups = {};
      }
      return data;
    }
  } catch (e) {
    console.error('读取账本数据失败:', e);
  }
  return { records: [], recycleBin: [], budgets: [], mergeHistory: [], groups: [], contactGroups: {}, version: STORAGE_VERSION };
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
    recycleBin: [],
    budgets: [],
    mergeHistory: [],
    groups: [],
    contactGroups: {},
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

function getStorageData(): LedgerStorageData {
  return getLedgerData(currentLedgerId);
}

function saveStorageData(data: LedgerStorageData): void {
  saveLedgerData(currentLedgerId, data);
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

function isWithinRecycleBinPeriod(deletedAt: string): boolean {
  const now = new Date();
  const deleted = new Date(deletedAt);
  const diffMs = now.getTime() - deleted.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  return diffDays <= RECYCLE_BIN_DAYS;
}

export function cleanExpiredRecycleBin(): number {
  const data = getStorageData();
  const initialLength = data.recycleBin.length;
  data.recycleBin = data.recycleBin.filter(r => r.deletedAt && isWithinRecycleBinPeriod(r.deletedAt));
  const removed = initialLength - data.recycleBin.length;
  if (removed > 0) {
    saveStorageData(data);
  }
  return removed;
}

export function getRecords(): GiftRecord[] {
  cleanExpiredRecycleBin();
  const data = getStorageData();
  return data.records
    .filter(r => !r.deletedAt)
    .map(r => ({ ...r, tags: r.tags || [], imageUrls: r.imageUrls || [], isFavorite: r.isFavorite || false }))
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
    isFavorite: record.isFavorite || false,
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
  const index = data.records.findIndex(r => r.id === id);
  if (index === -1) return false;
  
  const record = data.records[index];
  const deletedRecord: GiftRecord = {
    ...record,
    deletedAt: new Date().toISOString(),
  };
  
  data.records.splice(index, 1);
  data.recycleBin.unshift(deletedRecord);
  
  cleanExpiredRecycleBinInternal(data);
  saveStorageData(data);
  return true;
}

function cleanExpiredRecycleBinInternal(data: { records: GiftRecord[]; recycleBin: GiftRecord[]; version: string }): void {
  data.recycleBin = data.recycleBin.filter(r => r.deletedAt && isWithinRecycleBinPeriod(r.deletedAt));
}

export function getRecycleBinRecords(): GiftRecord[] {
  cleanExpiredRecycleBin();
  const data = getStorageData();
  return data.recycleBin
    .map(r => ({ ...r, tags: r.tags || [], imageUrls: r.imageUrls || [], isFavorite: r.isFavorite || false }))
    .sort((a, b) => {
      const timeA = a.deletedAt ? new Date(a.deletedAt).getTime() : 0;
      const timeB = b.deletedAt ? new Date(b.deletedAt).getTime() : 0;
      return timeB - timeA;
    });
}

export function restoreRecord(id: string): boolean {
  const data = getStorageData();
  const index = data.recycleBin.findIndex(r => r.id === id);
  if (index === -1) return false;
  
  const record = data.recycleBin[index];
  const restoredRecord: GiftRecord = { ...record };
  delete restoredRecord.deletedAt;
  restoredRecord.updatedAt = new Date().toISOString();
  
  data.recycleBin.splice(index, 1);
  data.records.push(restoredRecord);
  
  saveStorageData(data);
  return true;
}

export function permanentlyDeleteRecord(id: string): boolean {
  const data = getStorageData();
  const initialLength = data.recycleBin.length;
  data.recycleBin = data.recycleBin.filter(r => r.id !== id);
  if (data.recycleBin.length === initialLength) return false;
  saveStorageData(data);
  return true;
}

export function clearAllRecycleBin(): number {
  const data = getStorageData();
  const count = data.recycleBin.length;
  data.recycleBin = [];
  saveStorageData(data);
  return count;
}

export function getRecycleBinCount(): number {
  cleanExpiredRecycleBin();
  const data = getStorageData();
  return data.recycleBin.length;
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
  const data = getLedgerData(currentLedgerId);
  saveStorageData({
    ...data,
    records: [],
    recycleBin: [],
  });
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

  const targetHasGroup = !!data.contactGroups[targetContactName];
  sourceContactNames.forEach(sourceName => {
    const sourceGroupId = data.contactGroups[sourceName];
    if (sourceGroupId && !targetHasGroup) {
      data.contactGroups[targetContactName] = sourceGroupId;
    }
    delete data.contactGroups[sourceName];
  });

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
      recycleBin: [],
      budgets: [],
      mergeHistory: [],
      groups: [],
      contactGroups: {},
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

export function getUserPreferences(): UserPreferences {
  try {
    const raw = localStorage.getItem(PREFERENCES_KEY);
    if (raw) {
      const data = JSON.parse(raw);
      return {
        ...DEFAULT_PREFERENCES,
        ...data,
      };
    }
  } catch (e) {
    console.error('读取用户偏好设置失败:', e);
  }
  return { ...DEFAULT_PREFERENCES };
}

export function setUserPreferences(preferences: Partial<UserPreferences>): UserPreferences {
  try {
    const current = getUserPreferences();
    const updated: UserPreferences = {
      ...current,
      ...preferences,
    };
    localStorage.setItem(PREFERENCES_KEY, JSON.stringify(updated));
    return updated;
  } catch (e) {
    console.error('保存用户偏好设置失败:', e);
    return { ...DEFAULT_PREFERENCES };
  }
}

const TEMPLATES_KEY = 'gift_ledger_templates';

export function getTemplates(): RecordTemplate[] {
  try {
    const raw = localStorage.getItem(TEMPLATES_KEY);
    if (raw) {
      const templates = JSON.parse(raw) as RecordTemplate[];
      return templates.sort((a, b) => 
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
    }
  } catch (e) {
    console.error('读取模板失败:', e);
  }
  return [];
}

export function addTemplate(template: Omit<RecordTemplate, 'id' | 'createdAt'>): RecordTemplate {
  const templates = getTemplates();
  const now = new Date().toISOString();
  const newTemplate: RecordTemplate = {
    ...template,
    id: generateId(),
    createdAt: now,
  };
  templates.push(newTemplate);
  try {
    localStorage.setItem(TEMPLATES_KEY, JSON.stringify(templates));
  } catch (e) {
    console.error('保存模板失败:', e);
  }
  return newTemplate;
}

export function deleteTemplate(id: string): boolean {
  const templates = getTemplates();
  const initialLength = templates.length;
  const filtered = templates.filter(t => t.id !== id);
  if (filtered.length === initialLength) return false;
  try {
    localStorage.setItem(TEMPLATES_KEY, JSON.stringify(filtered));
  } catch (e) {
    console.error('删除模板失败:', e);
    return false;
  }
  return true;
}

export function toggleFavorite(id: string): GiftRecord | null {
  const data = getStorageData();
  const index = data.records.findIndex(r => r.id === id);
  if (index === -1) return null;
  
  const now = new Date().toISOString();
  const record = data.records[index];
  const newIsFavorite = !record.isFavorite;
  
  const updatedRecord: GiftRecord = {
    ...record,
    isFavorite: newIsFavorite,
    favoritedAt: newIsFavorite ? now : undefined,
    updatedAt: now,
  };
  data.records[index] = updatedRecord;
  saveStorageData(data);
  return updatedRecord;
}

export function getFavoriteRecords(): GiftRecord[] {
  const records = getRecords();
  return records
    .filter(r => r.isFavorite)
    .sort((a, b) => {
      const timeA = a.favoritedAt ? new Date(a.favoritedAt).getTime() : 0;
      const timeB = b.favoritedAt ? new Date(b.favoritedAt).getTime() : 0;
      return timeB - timeA;
    });
}

export function getGroups(): ContactGroup[] {
  const data = getLedgerData(currentLedgerId);
  return data.groups.sort((a, b) => a.sortOrder - b.sortOrder);
}

export function getGroupById(groupId: string): ContactGroup | undefined {
  const groups = getGroups();
  return groups.find(g => g.id === groupId);
}

export function createGroup(name: string, color: string, icon: string): ContactGroup {
  const data = getLedgerData(currentLedgerId);
  const now = new Date().toISOString();
  const newGroup: ContactGroup = {
    id: generateId(),
    name,
    color,
    icon,
    sortOrder: data.groups.length,
    createdAt: now,
    updatedAt: now,
  };
  data.groups.push(newGroup);
  saveLedgerData(currentLedgerId, data);
  return newGroup;
}

export function updateGroup(groupId: string, updates: Partial<ContactGroup>): ContactGroup | null {
  const data = getLedgerData(currentLedgerId);
  const index = data.groups.findIndex(g => g.id === groupId);
  if (index === -1) return null;
  
  const updatedGroup: ContactGroup = {
    ...data.groups[index],
    ...updates,
    id: groupId,
    updatedAt: new Date().toISOString(),
  };
  data.groups[index] = updatedGroup;
  saveLedgerData(currentLedgerId, data);
  return updatedGroup;
}

export function deleteGroup(groupId: string): boolean {
  const data = getLedgerData(currentLedgerId);
  const initialLength = data.groups.length;
  data.groups = data.groups.filter(g => g.id !== groupId);
  if (data.groups.length === initialLength) return false;
  
  Object.keys(data.contactGroups).forEach(contactName => {
    if (data.contactGroups[contactName] === groupId) {
      delete data.contactGroups[contactName];
    }
  });
  
  saveLedgerData(currentLedgerId, data);
  return true;
}

export function getContactGroupId(contactName: string): string | null {
  const data = getLedgerData(currentLedgerId);
  return data.contactGroups[contactName] || null;
}

export function setContactGroup(contactName: string, groupId: string | null): boolean {
  const data = getLedgerData(currentLedgerId);
  if (groupId === null) {
    delete data.contactGroups[contactName];
  } else {
    data.contactGroups[contactName] = groupId;
  }
  saveLedgerData(currentLedgerId, data);
  return true;
}

export function getContactsByGroup(groupId: string | null): string[] {
  const data = getLedgerData(currentLedgerId);
  if (groupId === null) {
    const allContacts = new Set(data.records.filter(r => !r.deletedAt).map(r => r.contactName));
    const groupedContacts = new Set(Object.keys(data.contactGroups));
    return Array.from(allContacts).filter(name => !groupedContacts.has(name));
  }
  return Object.entries(data.contactGroups)
    .filter(([, gid]) => gid === groupId)
    .map(([name]) => name);
}

export function reorderGroups(groupIds: string[]): boolean {
  const data = getLedgerData(currentLedgerId);
  groupIds.forEach((id, index) => {
    const group = data.groups.find(g => g.id === id);
    if (group) {
      group.sortOrder = index;
      group.updatedAt = new Date().toISOString();
    }
  });
  saveLedgerData(currentLedgerId, data);
  return true;
}
