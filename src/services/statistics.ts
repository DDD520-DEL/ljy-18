import type { GiftRecord, ContactSummary, YearlyStats, GiftSuggestion, EventType, BudgetProgress } from '@/types';
import { getRecords, getRecordsByContact, getRecordsByYear, getAvailableYears, getYearlyBudget } from './storage';
import { formatDate } from '@/utils/date';

export function getContactSummaryList(): ContactSummary[] {
  const records = getRecords();
  const contactMap = new Map<string, GiftRecord[]>();
  
  records.forEach(record => {
    if (!contactMap.has(record.contactName)) {
      contactMap.set(record.contactName, []);
    }
    contactMap.get(record.contactName)!.push(record);
  });
  
  const summaries: ContactSummary[] = [];
  
  contactMap.forEach((contactRecords, name) => {
    const sortedRecords = contactRecords.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    
    const totalExpense = contactRecords
      .filter(r => r.direction === 'expense')
      .reduce((sum, r) => sum + r.amount, 0);
    
    const totalIncome = contactRecords
      .filter(r => r.direction === 'income')
      .reduce((sum, r) => sum + r.amount, 0);
    
    const incomeRecords = contactRecords
      .filter(r => r.direction === 'income')
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    const lastIncome = incomeRecords[0];
    
    summaries.push({
      name,
      totalExpense,
      totalIncome,
      balance: totalExpense - totalIncome,
      recordCount: contactRecords.length,
      lastRecordDate: sortedRecords[0]?.date || '',
      lastIncomeAmount: lastIncome?.amount || 0,
      lastIncomeDate: lastIncome?.date || '',
      records: sortedRecords,
    });
  });
  
  return summaries.sort((a, b) => 
    new Date(b.lastRecordDate).getTime() - new Date(a.lastRecordDate).getTime()
  );
}

export function getContactDetail(name: string): ContactSummary | null {
  const records = getRecordsByContact(name);
  if (records.length === 0) return null;
  
  const totalExpense = records
    .filter(r => r.direction === 'expense')
    .reduce((sum, r) => sum + r.amount, 0);
  
  const totalIncome = records
    .filter(r => r.direction === 'income')
    .reduce((sum, r) => sum + r.amount, 0);
  
  const incomeRecords = records
    .filter(r => r.direction === 'income')
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  
  const lastIncome = incomeRecords[0];
  
  return {
    name,
    totalExpense,
    totalIncome,
    balance: totalExpense - totalIncome,
    recordCount: records.length,
    lastRecordDate: records[0]?.date || '',
    lastIncomeAmount: lastIncome?.amount || 0,
    lastIncomeDate: lastIncome?.date || '',
    records,
  };
}

export function getGiftSuggestion(contactName: string): GiftSuggestion {
  const detail = getContactDetail(contactName);
  
  if (!detail || detail.lastIncomeAmount === 0) {
    return {
      hasHistory: false,
      lastIncomeAmount: 0,
      lastIncomeDate: '',
      suggestedAmount: 0,
      message: '暂无对方随礼记录',
    };
  }
  
  const suggestedAmount = Math.ceil(detail.lastIncomeAmount / 100) * 100;
  
  return {
    hasHistory: true,
    lastIncomeAmount: detail.lastIncomeAmount,
    lastIncomeDate: detail.lastIncomeDate,
    suggestedAmount: suggestedAmount < detail.lastIncomeAmount ? detail.lastIncomeAmount : suggestedAmount,
    message: `${formatDate(detail.lastIncomeDate)}对方随了 ¥${detail.lastIncomeAmount}，建议回礼不低于此金额`,
  };
}

export function getYearlyStats(year: number): YearlyStats {
  const records = getRecordsByYear(year);
  
  const totalExpense = records
    .filter(r => r.direction === 'expense')
    .reduce((sum, r) => sum + r.amount, 0);
  
  const totalIncome = records
    .filter(r => r.direction === 'income')
    .reduce((sum, r) => sum + r.amount, 0);
  
  const eventTypes: EventType[] = ['wedding', 'funeral', 'birthday', 'baby', 'housewarming', 'promotion', 'other'];
  
  const expenseByType = {} as Record<EventType, number>;
  const incomeByType = {} as Record<EventType, number>;
  
  eventTypes.forEach(type => {
    expenseByType[type] = records
      .filter(r => r.direction === 'expense' && r.eventType === type)
      .reduce((sum, r) => sum + r.amount, 0);
    incomeByType[type] = records
      .filter(r => r.direction === 'income' && r.eventType === type)
      .reduce((sum, r) => sum + r.amount, 0);
  });
  
  const monthlyExpense = new Array(12).fill(0);
  const monthlyIncome = new Array(12).fill(0);
  
  records.forEach(record => {
    const month = new Date(record.date).getMonth();
    if (record.direction === 'expense') {
      monthlyExpense[month] += record.amount;
    } else {
      monthlyIncome[month] += record.amount;
    }
  });
  
  return {
    year,
    totalExpense,
    totalIncome,
    balance: totalIncome - totalExpense,
    recordCount: records.length,
    expenseByType,
    incomeByType,
    monthlyExpense,
    monthlyIncome,
  };
}

export function getAllYearlyStats(): YearlyStats[] {
  const years = getAvailableYears();
  return years.map(year => getYearlyStats(year));
}

export function getCurrentYearStats(): YearlyStats {
  const currentYear = new Date().getFullYear();
  return getYearlyStats(currentYear);
}

export function getRecentRecords(limit: number = 5): GiftRecord[] {
  const records = getRecords();
  return records.slice(0, limit);
}

export function getTotalStats() {
  const records = getRecords();
  
  const totalExpense = records
    .filter(r => r.direction === 'expense')
    .reduce((sum, r) => sum + r.amount, 0);
  
  const totalIncome = records
    .filter(r => r.direction === 'income')
    .reduce((sum, r) => sum + r.amount, 0);
  
  return {
    totalExpense,
    totalIncome,
    balance: totalIncome - totalExpense,
    recordCount: records.length,
    contactCount: getContactSummaryList().length,
  };
}

export { getAvailableYears };

export function getBudgetProgress(year: number): BudgetProgress {
  const yearlyBudget = getYearlyBudget(year);
  const budget = yearlyBudget?.budget || 0;
  const yearlyStats = getYearlyStats(year);
  const used = yearlyStats.totalExpense;
  const remaining = Math.max(budget - used, 0);
  const percentage = budget > 0 ? Math.min((used / budget) * 100, 100) : 0;
  
  const monthlyBudget = budget > 0 ? budget / 12 : 0;
  const currentMonth = new Date().getMonth();
  const currentMonthUsed = yearlyStats.monthlyExpense[currentMonth] || 0;
  const currentMonthRemaining = Math.max(monthlyBudget - currentMonthUsed, 0);
  const currentMonthPercentage = monthlyBudget > 0 ? Math.min((currentMonthUsed / monthlyBudget) * 100, 100) : 0;
  
  return {
    year,
    budget,
    used,
    remaining,
    percentage,
    monthlyBudget,
    currentMonthUsed,
    currentMonthRemaining,
    currentMonthPercentage,
    isOverBudget: budget > 0 && used > budget,
    isMonthOverBudget: monthlyBudget > 0 && currentMonthUsed > monthlyBudget,
  };
}

export function checkMonthlyBudgetAfterExpense(year: number, month: number, additionalAmount: number): {
  wouldExceed: boolean;
  monthlyBudget: number;
  currentMonthUsed: number;
  newTotal: number;
} {
  const yearlyBudget = getYearlyBudget(year);
  const budget = yearlyBudget?.budget || 0;
  const monthlyBudget = budget > 0 ? budget / 12 : 0;
  const yearlyStats = getYearlyStats(year);
  const currentMonthUsed = yearlyStats.monthlyExpense[month] || 0;
  const newTotal = currentMonthUsed + additionalAmount;
  
  return {
    wouldExceed: monthlyBudget > 0 && newTotal > monthlyBudget,
    monthlyBudget,
    currentMonthUsed,
    newTotal,
  };
}
