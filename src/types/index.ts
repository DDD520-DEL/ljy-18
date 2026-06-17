export type EventType = 
  | 'wedding' 
  | 'funeral' 
  | 'birthday' 
  | 'baby' 
  | 'housewarming' 
  | 'promotion' 
  | 'other';

export type Direction = 'expense' | 'income';

export interface GiftRecord {
  id: string;
  contactName: string;
  eventType: EventType;
  eventName: string;
  amount: number;
  direction: Direction;
  date: string;
  note: string;
  tags: string[];
  imageUrls: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ContactSummary {
  name: string;
  totalExpense: number;
  totalIncome: number;
  balance: number;
  recordCount: number;
  lastRecordDate: string;
  lastIncomeAmount: number;
  lastIncomeDate: string;
  records: GiftRecord[];
}

export interface YearlyStats {
  year: number;
  totalExpense: number;
  totalIncome: number;
  balance: number;
  recordCount: number;
  expenseByType: Record<EventType, number>;
  incomeByType: Record<EventType, number>;
  monthlyExpense: number[];
  monthlyIncome: number[];
}

export interface GiftSuggestion {
  hasHistory: boolean;
  lastIncomeAmount: number;
  lastIncomeDate: string;
  suggestedAmount: number;
  message: string;
}

export const EVENT_TYPE_LABELS: Record<EventType, string> = {
  wedding: '婚礼',
  funeral: '丧事',
  birthday: '生日',
  baby: '满月/百日',
  housewarming: '乔迁',
  promotion: '升学/升职',
  other: '其他',
};

export const EVENT_TYPE_ICONS: Record<EventType, string> = {
  wedding: '❤️',
  funeral: '🕯️',
  birthday: '🎂',
  baby: '👶',
  housewarming: '🏠',
  promotion: '🎓',
  other: '📦',
};

export const EVENT_TYPE_COLORS: Record<EventType, string> = {
  wedding: 'bg-primary-100 text-primary-600',
  funeral: 'bg-gray-100 text-gray-600',
  birthday: 'bg-pink-100 text-pink-600',
  baby: 'bg-yellow-100 text-yellow-700',
  housewarming: 'bg-green-100 text-green-600',
  promotion: 'bg-blue-100 text-blue-600',
  other: 'bg-purple-100 text-purple-600',
};

export interface YearlyBudget {
  year: number;
  budget: number;
}

export interface BudgetProgress {
  year: number;
  budget: number;
  used: number;
  remaining: number;
  percentage: number;
  monthlyBudget: number;
  currentMonthUsed: number;
  currentMonthRemaining: number;
  currentMonthPercentage: number;
  isOverBudget: boolean;
  isMonthOverBudget: boolean;
}

export type ReminderType = 'overdue' | 'upcoming' | 'unbalanced';

export interface ReturnGiftReminder {
  contactName: string;
  type: ReminderType;
  lastIncomeAmount: number;
  lastIncomeDate: string;
  myTotalExpense: number;
  suggestedAmount: number;
  daysSinceLastIncome: number;
  daysUntilDeadline: number;
  message: string;
  urgency: 'high' | 'medium' | 'low';
}

export interface MergeRecord {
  id: string;
  sourceContactNames: string[];
  targetContactName: string;
  modifiedRecords: Array<{
    recordId: string;
    oldContactName: string;
    newContactName: string;
  }>;
  mergedAt: string;
}

export interface MergeResult {
  success: boolean;
  mergeRecord?: MergeRecord;
  message: string;
  updatedCount: number;
}

export interface Ledger {
  id: string;
  name: string;
  icon: string;
  color: string;
  createdAt: string;
  updatedAt: string;
}

export const LEDGER_COLORS = [
  'from-primary-500 to-primary-700',
  'from-emerald-500 to-emerald-700',
  'from-blue-500 to-blue-700',
  'from-gold-500 to-gold-700',
  'from-purple-500 to-purple-700',
  'from-pink-500 to-pink-700',
];

export const LEDGER_ICONS = ['🧧', '👨‍👩‍👧', '💼', '🎂', '🎉', '📚'];

export const DEFAULT_TAGS = ['重要', '已回礼', '待回礼', '关系密切', '普通往来', '长辈', '同事', '亲友'];

export const TAG_COLORS: Record<string, string> = {
  '重要': 'bg-red-100 text-red-600',
  '已回礼': 'bg-emerald-100 text-emerald-600',
  '待回礼': 'bg-amber-100 text-amber-600',
  '关系密切': 'bg-blue-100 text-blue-600',
  '普通往来': 'bg-gray-100 text-gray-600',
  '长辈': 'bg-purple-100 text-purple-600',
  '同事': 'bg-cyan-100 text-cyan-600',
  '亲友': 'bg-pink-100 text-pink-600',
};

export const TAG_CHART_COLORS: Record<string, string> = {
  '重要': '#EF4444',
  '已回礼': '#10B981',
  '待回礼': '#F59E0B',
  '关系密切': '#3B82F6',
  '普通往来': '#6B7280',
  '长辈': '#8B5CF6',
  '同事': '#06B6D4',
  '亲友': '#EC4899',
};
