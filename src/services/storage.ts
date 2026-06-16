import type { GiftRecord, YearlyBudget } from '@/types';
import { generateId } from '@/utils/id';

const STORAGE_KEY = 'gift_ledger_records';
const STORAGE_VERSION = '1.0';
const BUDGET_STORAGE_KEY = 'gift_ledger_budgets';

interface StorageData {
  records: GiftRecord[];
  version: string;
}

function getStorageData(): StorageData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const data = JSON.parse(raw) as StorageData;
      if (data.version === STORAGE_VERSION) {
        return data;
      }
    }
  } catch (e) {
    console.error('读取本地存储失败:', e);
  }
  return { records: [], version: STORAGE_VERSION };
}

function saveStorageData(data: StorageData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('保存本地存储失败:', e);
  }
}

function getBudgetStorageData(): YearlyBudget[] {
  try {
    const raw = localStorage.getItem(BUDGET_STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw) as YearlyBudget[];
    }
  } catch (e) {
    console.error('读取预算存储失败:', e);
  }
  return [];
}

function saveBudgetStorageData(budgets: YearlyBudget[]): void {
  try {
    localStorage.setItem(BUDGET_STORAGE_KEY, JSON.stringify(budgets));
  } catch (e) {
    console.error('保存预算存储失败:', e);
  }
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
  return data.records.sort((a, b) => 
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
