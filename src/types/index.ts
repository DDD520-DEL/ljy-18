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
  deletedAt?: string;
  isFavorite?: boolean;
  favoritedAt?: string;
}

export const RECYCLE_BIN_DAYS = 30;

export interface ContactSummary {
  name: string;
  groupId: string | null;
  totalExpense: number;
  totalIncome: number;
  balance: number;
  recordCount: number;
  lastRecordDate: string;
  lastIncomeAmount: number;
  lastIncomeDate: string;
  records: GiftRecord[];
}

export interface GroupSummary {
  groupId: string;
  groupName: string;
  totalExpense: number;
  totalIncome: number;
  balance: number;
  contactCount: number;
  recordCount: number;
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

export interface NetworkNode {
  id: string;
  name: string;
  totalAmount: number;
  totalExpense: number;
  totalIncome: number;
  recordCount: number;
  isSelf: boolean;
}

export interface NetworkLink {
  source: string;
  target: string;
  frequency: number;
  totalAmount: number;
  direction: 'both' | 'expense' | 'income';
  expenseAmount: number;
  incomeAmount: number;
  expenseCount: number;
  incomeCount: number;
}

export interface RelationNetworkData {
  nodes: NetworkNode[];
  links: NetworkLink[];
  summary: {
    totalContacts: number;
    totalRecords: number;
    totalAmount: number;
  };
}

export interface RecordTemplate {
  id: string;
  name: string;
  eventType: EventType;
  eventName: string;
  amount: number;
  direction: Direction;
  note: string;
  tags: string[];
  createdAt: string;
}

export interface ContactGroup {
  id: string;
  name: string;
  color: string;
  icon: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export const GROUP_COLORS = [
  'from-primary-500 to-primary-600',
  'from-emerald-500 to-emerald-600',
  'from-blue-500 to-blue-600',
  'from-gold-500 to-gold-600',
  'from-purple-500 to-purple-600',
  'from-pink-500 to-pink-600',
  'from-red-500 to-red-600',
  'from-cyan-500 to-cyan-600',
];

export const GROUP_ICONS = ['👨‍👩‍👧', '👥', '💼', '🎓', '🏠', '❤️', '🎉', '📚'];

export type WidgetType = 'monthlyTrend' | 'contactRanking' | 'expenseCategory' | 'incomeCategory' | 'recentRecords' | 'budgetProgress';

export interface WidgetConfig {
  id: string;
  type: WidgetType;
  title: string;
  icon: string;
  visible: boolean;
  sortOrder: number;
  size: 'small' | 'medium' | 'large';
}

export interface WidgetDefinition {
  type: WidgetType;
  title: string;
  icon: string;
  description: string;
  defaultSize: 'small' | 'medium' | 'large';
}

export const WIDGET_DEFINITIONS: Record<WidgetType, WidgetDefinition> = {
  monthlyTrend: {
    type: 'monthlyTrend',
    title: '本月人情趋势',
    icon: '📈',
    description: '显示本月每日收支趋势迷你折线图',
    defaultSize: 'large',
  },
  contactRanking: {
    type: 'contactRanking',
    title: '最近往来联系人排行',
    icon: '👥',
    description: '按最近往来频率排序的联系人列表',
    defaultSize: 'medium',
  },
  expenseCategory: {
    type: 'expenseCategory',
    title: '支出类别占比',
    icon: '🥧',
    description: '本年支出按类别的环形图占比',
    defaultSize: 'small',
  },
  incomeCategory: {
    type: 'incomeCategory',
    title: '收入类别占比',
    icon: '💰',
    description: '本年收入按类别的环形图占比',
    defaultSize: 'small',
  },
  recentRecords: {
    type: 'recentRecords',
    title: '最近记录',
    icon: '📋',
    description: '最近添加的人情往来记录',
    defaultSize: 'medium',
  },
  budgetProgress: {
    type: 'budgetProgress',
    title: '预算进度',
    icon: '🎯',
    description: '年度预算使用进度情况',
    defaultSize: 'small',
  },
};

export const DEFAULT_WIDGETS: WidgetConfig[] = [
  { id: '1', type: 'monthlyTrend', title: '本月人情趋势', icon: '📈', visible: true, sortOrder: 0, size: 'large' },
  { id: '2', type: 'contactRanking', title: '最近往来联系人排行', icon: '👥', visible: true, sortOrder: 1, size: 'medium' },
  { id: '3', type: 'expenseCategory', title: '支出类别占比', icon: '🥧', visible: true, sortOrder: 2, size: 'small' },
];

export interface UserPreferences {
  defaultDirection: Direction;
  recentRecordsCount: number;
  showCents: boolean;
  onboardingCompleted: boolean;
  dashboardWidgets?: WidgetConfig[];
}

export const DEFAULT_PREFERENCES: UserPreferences = {
  defaultDirection: 'expense',
  recentRecordsCount: 5,
  showCents: false,
  onboardingCompleted: false,
  dashboardWidgets: DEFAULT_WIDGETS,
};
