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
