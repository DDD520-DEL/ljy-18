import { create } from 'zustand';
import type { GiftRecord, ContactSummary, YearlyStats, GiftSuggestion, YearlyBudget, BudgetProgress, ReturnGiftReminder, MergeResult, MergeRecord, Ledger } from '@/types';
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
  mergeContacts as storageMergeContacts,
  undoLastMerge as storageUndoLastMerge,
  getLatestMergeRecord as storageGetLatestMergeRecord,
  getLedgers as storageGetLedgers,
  createLedger as storageCreateLedger,
  updateLedger as storageUpdateLedger,
  deleteLedger as storageDeleteLedger,
  setActiveLedger,
  getActiveLedgerId,
  migrateLegacyData,
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
  getReturnGiftReminders,
} from '@/services/statistics';
import { mockRecords } from '@/data/mockData';
import {
  exportEncryptedBackup as serviceExportEncryptedBackup,
  readBackupFile as serviceReadBackupFile,
  decryptBackup as serviceDecryptBackup,
  importBackup as serviceImportBackup,
  checkLocalDataExists as serviceCheckLocalDataExists,
  type BackupProgress,
  type BackupFile,
  type ImportMode,
  type ImportResult,
} from '@/services/backup';

function ensureDefaultLedger(): void {
  migrateLegacyData();
  
  const ledgers = storageGetLedgers();
  if (ledgers.length === 0) {
    const defaultLedger = storageCreateLedger('我的人情', '🧧', 'from-primary-500 to-primary-700');
    setActiveLedger(defaultLedger.id);
    importRecords(mockRecords);
  } else {
    const activeId = getActiveLedgerId();
    if (!activeId || !ledgers.find(l => l.id === activeId)) {
      setActiveLedger(ledgers[0].id);
    }
  }
}

function loadRecordsForCurrentLedger(): GiftRecord[] {
  return getRecords();
}

interface GiftStore {
  records: GiftRecord[];
  ledgers: Ledger[];
  currentLedgerId: string;
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
  
  getReturnGiftReminders: () => ReturnGiftReminder[];
  
  mergeContacts: (sourceContactNames: string[], targetContactName: string) => MergeResult;
  undoLastMerge: () => MergeResult;
  getLatestMergeRecord: () => MergeRecord | null;

  getCurrentLedger: () => Ledger | undefined;
  switchLedger: (ledgerId: string) => void;
  addLedger: (name: string, icon: string, color: string) => Ledger;
  editLedger: (ledgerId: string, updates: Partial<Ledger>) => Ledger | null;
  removeLedger: (ledgerId: string) => boolean;
  refreshLedgers: () => void;

  exportEncryptedBackup: (password: string, onProgress?: (progress: BackupProgress) => void) => Promise<void>;
  readBackupFile: (file: File) => Promise<string>;
  decryptBackup: (encryptedData: string, password: string, onProgress?: (progress: BackupProgress) => void) => Promise<BackupFile>;
  importBackup: (backupFile: BackupFile, mode: ImportMode, onProgress?: (progress: BackupProgress) => void) => Promise<ImportResult>;
  checkLocalDataExists: () => boolean;
}

export const useGiftStore = create<GiftStore>((set, get) => ({
  records: [],
  ledgers: [],
  currentLedgerId: '',
  isInitialized: false,
  
  initialize: () => {
    const { isInitialized } = get();
    if (isInitialized) return;
    
    ensureDefaultLedger();
    
    const ledgers = storageGetLedgers();
    const currentLedgerId = getActiveLedgerId();
    const records = loadRecordsForCurrentLedger();
    
    set({ records, ledgers, currentLedgerId, isInitialized: true });
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
  
  getReturnGiftReminders: () => {
    return getReturnGiftReminders();
  },
  
  mergeContacts: (sourceContactNames, targetContactName) => {
    const result = storageMergeContacts(sourceContactNames, targetContactName);
    if (result.success) {
      set({ records: getRecords() });
    }
    return result;
  },
  
  undoLastMerge: () => {
    const result = storageUndoLastMerge();
    if (result.success) {
      set({ records: getRecords() });
    }
    return result;
  },
  
  getLatestMergeRecord: () => {
    return storageGetLatestMergeRecord();
  },

  getCurrentLedger: () => {
    const { ledgers, currentLedgerId } = get();
    return ledgers.find(l => l.id === currentLedgerId);
  },

  switchLedger: (ledgerId) => {
    setActiveLedger(ledgerId);
    const records = loadRecordsForCurrentLedger();
    const ledgers = storageGetLedgers();
    set({ currentLedgerId: ledgerId, records, ledgers });
  },

  addLedger: (name, icon, color) => {
    const newLedger = storageCreateLedger(name, icon, color);
    const ledgers = storageGetLedgers();
    set({ ledgers });
    return newLedger;
  },

  editLedger: (ledgerId, updates) => {
    const result = storageUpdateLedger(ledgerId, updates);
    if (result) {
      const ledgers = storageGetLedgers();
      set({ ledgers });
    }
    return result;
  },

  removeLedger: (ledgerId) => {
    const success = storageDeleteLedger(ledgerId);
    if (success) {
      const ledgers = storageGetLedgers();
      const currentLedgerId = getActiveLedgerId();
      const records = loadRecordsForCurrentLedger();
      set({ ledgers, currentLedgerId, records });
    }
    return success;
  },

  refreshLedgers: () => {
    const ledgers = storageGetLedgers();
    const currentLedgerId = getActiveLedgerId();
    set({ ledgers, currentLedgerId });
  },

  exportEncryptedBackup: async (password, onProgress) => {
    await serviceExportEncryptedBackup(password, onProgress);
  },

  readBackupFile: async (file) => {
    return serviceReadBackupFile(file);
  },

  decryptBackup: async (encryptedData, password, onProgress) => {
    return serviceDecryptBackup(encryptedData, password, onProgress);
  },

  importBackup: async (backupFile, mode, onProgress) => {
    const result = await serviceImportBackup(backupFile, mode, onProgress);
    if (result.success) {
      set({ records: getRecords() });
    }
    return result;
  },

  checkLocalDataExists: () => {
    return serviceCheckLocalDataExists();
  },
}));
