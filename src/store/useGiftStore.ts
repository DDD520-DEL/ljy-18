import { create } from 'zustand';
import type { GiftRecord, ContactSummary, YearlyStats, GiftSuggestion, YearlyBudget, BudgetProgress } from '@/types';
import { 
  getRecords, 
  addRecord as storageAddRecord, 
  updateRecord as storageUpdateRecord,
  deleteRecord as storageDeleteRecord,
  getRecordById,
  importRecords,
  clearAllRecords,
  getAvailableYears,
  getYearlyBudget as storageGetYearlyBudget,
  getAllBudgets as storageGetAllBudgets,
  setYearlyBudget as storageSetYearlyBudget,
  deleteYearlyBudget as storageDeleteYearlyBudget,
} from '@/services/storage';
import {
  getContactSummaryList,
  getContactDetail,
  getGiftSuggestion,
  getYearlyStats,
  getCurrentYearStats,
  getRecentRecords,
  getTotalStats,
  getBudgetProgress,
  checkMonthlyBudgetAfterExpense,
} from '@/services/statistics';
import { mockRecords } from '@/data/mockData';

function loadInitialRecords(): GiftRecord[] {
  const records = getRecords();
  if (records.length === 0) {
    importRecords(mockRecords);
    return getRecords();
  }
  return records;
}

const initialRecords = loadInitialRecords();

interface GiftStore {
  records: GiftRecord[];
  isInitialized: boolean;
  
  initialize: () => void;
  loadMockData: () => void;
  refreshRecords: () => void;
  
  addRecord: (record: Omit<GiftRecord, 'id' | 'createdAt' | 'updatedAt'>) => GiftRecord;
  updateRecord: (id: string, updates: Partial<GiftRecord>) => GiftRecord | null;
  deleteRecord: (id: string) => boolean;
  getRecordById: (id: string) => GiftRecord | undefined;
  
  getContactSummaryList: () => ContactSummary[];
  getContactDetail: (name: string) => ContactSummary | null;
  getGiftSuggestion: (contactName: string) => GiftSuggestion;
  
  getYearlyStats: (year: number) => YearlyStats;
  getCurrentYearStats: () => YearlyStats;
  getAvailableYears: () => number[];
  
  getRecentRecords: (limit?: number) => GiftRecord[];
  getTotalStats: () => {
    totalExpense: number;
    totalIncome: number;
    balance: number;
    recordCount: number;
    contactCount: number;
  };
  
  getYearlyBudget: (year: number) => YearlyBudget | undefined;
  getAllBudgets: () => YearlyBudget[];
  setYearlyBudget: (year: number, budget: number) => YearlyBudget;
  deleteYearlyBudget: (year: number) => boolean;
  getBudgetProgress: (year: number) => BudgetProgress;
  checkMonthlyBudgetAfterExpense: (year: number, month: number, additionalAmount: number) => {
    wouldExceed: boolean;
    monthlyBudget: number;
    currentMonthUsed: number;
    newTotal: number;
  };
}

export const useGiftStore = create<GiftStore>((set, get) => ({
  records: initialRecords,
  isInitialized: true,
  
  initialize: () => {
    const { isInitialized } = get();
    if (isInitialized) return;
    
    const records = loadInitialRecords();
    set({ records, isInitialized: true });
  },
  
  loadMockData: () => {
    clearAllRecords();
    importRecords(mockRecords);
    set({ records: getRecords() });
  },
  
  refreshRecords: () => {
    set({ records: getRecords() });
  },
  
  addRecord: (record) => {
    const newRecord = storageAddRecord(record);
    set({ records: getRecords() });
    return newRecord;
  },
  
  updateRecord: (id, updates) => {
    const result = storageUpdateRecord(id, updates);
    if (result) {
      set({ records: getRecords() });
    }
    return result;
  },
  
  deleteRecord: (id) => {
    const success = storageDeleteRecord(id);
    if (success) {
      set({ records: getRecords() });
    }
    return success;
  },
  
  getRecordById: (id) => {
    return getRecordById(id);
  },
  
  getContactSummaryList: () => {
    return getContactSummaryList();
  },
  
  getContactDetail: (name) => {
    return getContactDetail(name);
  },
  
  getGiftSuggestion: (contactName) => {
    return getGiftSuggestion(contactName);
  },
  
  getYearlyStats: (year) => {
    return getYearlyStats(year);
  },
  
  getCurrentYearStats: () => {
    return getCurrentYearStats();
  },
  
  getAvailableYears: () => {
    return getAvailableYears();
  },
  
  getRecentRecords: (limit = 5) => {
    return getRecentRecords(limit);
  },
  
  getTotalStats: () => {
    return getTotalStats();
  },
  
  getYearlyBudget: (year) => {
    return storageGetYearlyBudget(year);
  },
  
  getAllBudgets: () => {
    return storageGetAllBudgets();
  },
  
  setYearlyBudget: (year, budget) => {
    return storageSetYearlyBudget(year, budget);
  },
  
  deleteYearlyBudget: (year) => {
    return storageDeleteYearlyBudget(year);
  },
  
  getBudgetProgress: (year) => {
    return getBudgetProgress(year);
  },
  
  checkMonthlyBudgetAfterExpense: (year, month, additionalAmount) => {
    return checkMonthlyBudgetAfterExpense(year, month, additionalAmount);
  },
}));
