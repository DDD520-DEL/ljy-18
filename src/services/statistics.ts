import type { GiftRecord, ContactSummary, YearlyStats, GiftSuggestion, EventType, BudgetProgress, ReturnGiftReminder, ReminderType, RelationNetworkData, NetworkNode, NetworkLink, GroupSummary, ContactGroup } from '@/types';
import { getRecords, getRecordsByContact, getRecordsByYear, getAvailableYears, getYearlyBudget, getContactGroupId, getGroups } from './storage';
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
      groupId: getContactGroupId(name),
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
    groupId: getContactGroupId(name),
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

const RETURN_GIFT_CYCLE_DAYS = 365;
const REMINDER_ADVANCE_DAYS = 30;
const AMOUNT_TOLERANCE_RATIO = 0.9;

function calculateDaysDifference(dateStr: string): number {
  const date = new Date(dateStr);
  const now = new Date();
  const diffTime = now.getTime() - date.getTime();
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
}

function generateReminderMessage(
  contactName: string,
  type: ReminderType,
  amount: number,
  daysSince: number,
  daysUntil: number
): string {
  switch (type) {
    case 'overdue':
      return `${contactName} 上次随礼已过去 ${daysSince} 天，超过合理回礼周期，建议尽快回礼。`;
    case 'upcoming':
      return `距离 ${contactName} 上次随礼满一周年还有 ${daysUntil} 天，建议提前准备回礼。`;
    case 'unbalanced':
      return `${contactName} 累计随礼 ¥${amount}，您的回礼金额偏低，建议补回差额。`;
    default:
      return `建议给 ${contactName} 回礼。`;
  }
}

function determineUrgency(type: ReminderType, daysSince: number, daysUntil: number): 'high' | 'medium' | 'low' {
  if (type === 'overdue') {
    return daysSince > RETURN_GIFT_CYCLE_DAYS + 60 ? 'high' : 'medium';
  }
  if (type === 'upcoming') {
    return daysUntil <= 15 ? 'high' : 'medium';
  }
  return 'low';
}

export function getReturnGiftReminders(): ReturnGiftReminder[] {
  const contactSummaries = getContactSummaryList();
  const reminders: ReturnGiftReminder[] = [];

  contactSummaries.forEach((contact) => {
    if (contact.lastIncomeAmount === 0) return;

    const daysSinceLastIncome = calculateDaysDifference(contact.lastIncomeDate);
    const daysUntilDeadline = RETURN_GIFT_CYCLE_DAYS - daysSinceLastIncome;

    let type: ReminderType | null = null;

    if (daysSinceLastIncome > RETURN_GIFT_CYCLE_DAYS) {
      type = 'overdue';
    } else if (daysUntilDeadline <= REMINDER_ADVANCE_DAYS && daysUntilDeadline >= 0) {
      type = 'upcoming';
    } else if (contact.totalIncome > 0 && contact.totalExpense < contact.lastIncomeAmount * AMOUNT_TOLERANCE_RATIO) {
      type = 'unbalanced';
    }

    if (type) {
      const suggestedAmount = Math.ceil(contact.lastIncomeAmount / 100) * 100;
      const finalSuggestedAmount = suggestedAmount < contact.lastIncomeAmount 
        ? contact.lastIncomeAmount 
        : suggestedAmount;

      const messageAmount = type === 'unbalanced' ? contact.totalIncome : contact.lastIncomeAmount;

      reminders.push({
        contactName: contact.name,
        type,
        lastIncomeAmount: contact.lastIncomeAmount,
        lastIncomeDate: contact.lastIncomeDate,
        myTotalExpense: contact.totalExpense,
        suggestedAmount: finalSuggestedAmount,
        daysSinceLastIncome,
        daysUntilDeadline,
        message: generateReminderMessage(
          contact.name,
          type,
          messageAmount,
          daysSinceLastIncome,
          daysUntilDeadline
        ),
        urgency: determineUrgency(type, daysSinceLastIncome, daysUntilDeadline),
      });
    }
  });

  return reminders.sort((a, b) => {
    const urgencyOrder = { high: 0, medium: 1, low: 2 };
    const urgencyDiff = urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
    if (urgencyDiff !== 0) return urgencyDiff;
    
    const typeOrder = { overdue: 0, upcoming: 1, unbalanced: 2 };
    const typeDiff = typeOrder[a.type] - typeOrder[b.type];
    if (typeDiff !== 0) return typeDiff;
    
    return a.daysUntilDeadline - b.daysUntilDeadline;
  });
}

const SELF_NODE_ID = 'self';
const SELF_NODE_NAME = '我';

export function getRelationNetworkData(records: GiftRecord[]): RelationNetworkData {
  const contactMap = new Map<string, {
    totalExpense: number;
    totalIncome: number;
    recordCount: number;
    expenseCount: number;
    incomeCount: number;
  }>();

  let totalRecords = 0;
  let totalAmount = 0;

  records.forEach(record => {
    totalRecords++;
    totalAmount += record.amount;

    if (!contactMap.has(record.contactName)) {
      contactMap.set(record.contactName, {
        totalExpense: 0,
        totalIncome: 0,
        recordCount: 0,
        expenseCount: 0,
        incomeCount: 0,
      });
    }

    const contact = contactMap.get(record.contactName)!;
    contact.recordCount++;

    if (record.direction === 'expense') {
      contact.totalExpense += record.amount;
      contact.expenseCount++;
    } else {
      contact.totalIncome += record.amount;
      contact.incomeCount++;
    }
  });

  const nodes: NetworkNode[] = [];
  const links: NetworkLink[] = [];

  let selfTotalExpense = 0;
  let selfTotalIncome = 0;
  let selfRecordCount = 0;

  contactMap.forEach((data, name) => {
    selfTotalExpense += data.totalExpense;
    selfTotalIncome += data.totalIncome;
    selfRecordCount += data.recordCount;

    const totalAmountForContact = data.totalExpense + data.totalIncome;

    nodes.push({
      id: `contact-${name}`,
      name,
      totalAmount: totalAmountForContact,
      totalExpense: data.totalExpense,
      totalIncome: data.totalIncome,
      recordCount: data.recordCount,
      isSelf: false,
    });

    let direction: 'both' | 'expense' | 'income';
    if (data.expenseCount > 0 && data.incomeCount > 0) {
      direction = 'both';
    } else if (data.expenseCount > 0) {
      direction = 'expense';
    } else {
      direction = 'income';
    }

    let linkSource: string;
    let linkTarget: string;

    if (direction === 'income') {
      linkSource = `contact-${name}`;
      linkTarget = SELF_NODE_ID;
    } else {
      linkSource = SELF_NODE_ID;
      linkTarget = `contact-${name}`;
    }

    links.push({
      source: linkSource,
      target: linkTarget,
      frequency: data.recordCount,
      totalAmount: totalAmountForContact,
      direction,
      expenseAmount: data.totalExpense,
      incomeAmount: data.totalIncome,
      expenseCount: data.expenseCount,
      incomeCount: data.incomeCount,
    });
  });

  nodes.unshift({
    id: SELF_NODE_ID,
    name: SELF_NODE_NAME,
    totalAmount: selfTotalExpense + selfTotalIncome,
    totalExpense: selfTotalExpense,
    totalIncome: selfTotalIncome,
    recordCount: selfRecordCount,
    isSelf: true,
  });

  return {
    nodes,
    links,
    summary: {
      totalContacts: contactMap.size,
      totalRecords,
      totalAmount,
    },
  };
}

export function getYearlyRelationNetworkData(year: number): RelationNetworkData {
  const records = getRecordsByYear(year);
  return getRelationNetworkData(records);
}

export function getAllTimeRelationNetworkData(): RelationNetworkData {
  const records = getRecords();
  return getRelationNetworkData(records);
}

export function getGroupSummaries(): GroupSummary[] {
  const groups = getGroups();
  const contactSummaries = getContactSummaryList();
  
  const groupMap = new Map<string, ContactSummary[]>();
  const ungrouped: ContactSummary[] = [];
  
  contactSummaries.forEach(contact => {
    if (contact.groupId) {
      if (!groupMap.has(contact.groupId)) {
        groupMap.set(contact.groupId, []);
      }
      groupMap.get(contact.groupId)!.push(contact);
    } else {
      ungrouped.push(contact);
    }
  });
  
  const summaries: GroupSummary[] = [];
  
  groups.forEach(group => {
    const contacts = groupMap.get(group.id) || [];
    const totalExpense = contacts.reduce((sum, c) => sum + c.totalExpense, 0);
    const totalIncome = contacts.reduce((sum, c) => sum + c.totalIncome, 0);
    const recordCount = contacts.reduce((sum, c) => sum + c.recordCount, 0);
    
    summaries.push({
      groupId: group.id,
      groupName: group.name,
      totalExpense,
      totalIncome,
      balance: totalExpense - totalIncome,
      contactCount: contacts.length,
      recordCount,
    });
  });
  
  if (ungrouped.length > 0) {
    const totalExpense = ungrouped.reduce((sum, c) => sum + c.totalExpense, 0);
    const totalIncome = ungrouped.reduce((sum, c) => sum + c.totalIncome, 0);
    const recordCount = ungrouped.reduce((sum, c) => sum + c.recordCount, 0);
    
    summaries.push({
      groupId: '',
      groupName: '未分组',
      totalExpense,
      totalIncome,
      balance: totalExpense - totalIncome,
      contactCount: ungrouped.length,
      recordCount,
    });
  }
  
  return summaries;
}

export function getContactSummaryListByGroup(groupId: string | null): ContactSummary[] {
  const allContacts = getContactSummaryList();
  if (groupId === null) {
    return allContacts.filter(c => !c.groupId);
  }
  return allContacts.filter(c => c.groupId === groupId);
}
