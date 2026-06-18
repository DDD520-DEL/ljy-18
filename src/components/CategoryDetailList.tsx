import { useState, useMemo } from 'react';
import type { GiftRecord, EventType, Direction } from '@/types';
import { EVENT_TYPE_LABELS, EVENT_TYPE_ICONS, EVENT_TYPE_COLORS } from '@/types';
import { formatDateShort } from '@/utils/date';
import { formatMoney } from '@/utils/money';
import { ChevronDown, ChevronRight, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { useGiftStore } from '@/store/useGiftStore';
import { useNavigate } from 'react-router-dom';

interface CategoryDetailListProps {
  records: GiftRecord[];
}

interface TypeGroup {
  type: EventType;
  label: string;
  icon: string;
  totalAmount: number;
  recordCount: number;
  records: GiftRecord[];
}

function groupByEventType(records: GiftRecord[], direction: Direction): TypeGroup[] {
  const typeMap = new Map<EventType, GiftRecord[]>();
  
  records
    .filter(r => r.direction === direction)
    .forEach(record => {
      if (!typeMap.has(record.eventType)) {
        typeMap.set(record.eventType, []);
      }
      typeMap.get(record.eventType)!.push(record);
    });

  const result: TypeGroup[] = [];
  
  typeMap.forEach((typeRecords, type) => {
    const sortedRecords = [...typeRecords].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    const totalAmount = sortedRecords.reduce((sum, r) => sum + r.amount, 0);
    
    result.push({
      type,
      label: EVENT_TYPE_LABELS[type],
      icon: EVENT_TYPE_ICONS[type],
      totalAmount,
      recordCount: sortedRecords.length,
      records: sortedRecords,
    });
  });

  return result.sort((a, b) => b.totalAmount - a.totalAmount);
}

interface TypeGroupSectionProps {
  group: TypeGroup;
  direction: Direction;
  isExpanded: boolean;
  onToggle: () => void;
  showCents: boolean;
  onRecordClick: (recordId: string) => void;
}

function TypeGroupSection({ 
  group, 
  direction, 
  isExpanded, 
  onToggle, 
  showCents,
  onRecordClick,
}: TypeGroupSectionProps) {
  const isExpense = direction === 'expense';
  const amountColor = isExpense ? 'text-primary-500' : 'text-emerald-500';
  const amountSign = isExpense ? '-' : '+';
  const headerBg = isExpense 
    ? 'bg-gradient-to-r from-primary-50 to-transparent dark:from-primary-900/20 dark:to-transparent' 
    : 'bg-gradient-to-r from-emerald-50 to-transparent dark:from-emerald-900/20 dark:to-transparent';
  
  return (
    <div className="border border-ink-100 dark:border-ink-700 rounded-xl overflow-hidden">
      <button
        onClick={onToggle}
        className={`w-full flex items-center gap-3 p-4 ${headerBg} hover:opacity-90 transition-all active:scale-[0.995]`}
      >
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl ${EVENT_TYPE_COLORS[group.type]}`}>
          {group.icon}
        </div>
        
        <div className="flex-1 text-left">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-ink-800 dark:text-ink-200">
              {group.label}
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-ink-100 dark:bg-ink-700 text-ink-500 dark:text-ink-400">
              {group.recordCount} 笔
            </span>
          </div>
          <p className="text-xs text-ink-400 dark:text-ink-500 mt-0.5">
            {isExpense ? '累计支出' : '累计收入'}
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className={`font-bold text-lg tabular-nums ${amountColor}`}>
              {amountSign}{formatMoney(group.totalAmount, showCents).replace('¥', '')}
            </p>
            <p className="text-xs text-ink-400 dark:text-ink-500">
              {isExpense ? '支出' : '收入'}
            </p>
          </div>
          <div className={`p-1 rounded-lg transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
            <ChevronDown size={20} className="text-ink-400" />
          </div>
        </div>
      </button>
      
      <div className={`overflow-hidden transition-all duration-300 ease-in-out ${
        isExpanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
      }`}>
        <div className="divide-y divide-ink-50 dark:divide-ink-800">
          {group.records.map(record => (
            <div
              key={record.id}
              onClick={() => onRecordClick(record.id)}
              className="flex items-center gap-3 p-3 pl-[68px] hover:bg-cream-50 dark:hover:bg-ink-800/50 transition-colors cursor-pointer active:scale-[0.995]"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-ink-700 dark:text-ink-300 truncate">
                    {record.contactName}
                  </span>
                </div>
                <p className="text-xs text-ink-400 dark:text-ink-500 mt-0.5 truncate">
                  {record.eventName}
                </p>
              </div>
              
              <div className="text-right flex-shrink-0">
                <p className={`font-semibold tabular-nums ${amountColor} flex items-center gap-0.5 justify-end`}>
                  {isExpense ? (
                    <ArrowUpRight size={14} className="text-primary-400" />
                  ) : (
                    <ArrowDownLeft size={14} className="text-emerald-400" />
                  )}
                  {amountSign}{formatMoney(record.amount, showCents).replace('¥', '')}
                </p>
                <p className="text-xs text-ink-400 dark:text-ink-500 mt-0.5">
                  {formatDateShort(record.date)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function CategoryDetailList({ records }: CategoryDetailListProps) {
  const navigate = useNavigate();
  const showCents = useGiftStore(state => state.preferences.showCents);
  
  const [expandedTypes, setExpandedTypes] = useState<Set<string>>(new Set());
  
  const expenseGroups = useMemo(() => groupByEventType(records, 'expense'), [records]);
  const incomeGroups = useMemo(() => groupByEventType(records, 'income'), [records]);
  
  const totalExpense = useMemo(() => 
    expenseGroups.reduce((sum, g) => sum + g.totalAmount, 0),
    [expenseGroups]
  );
  const totalIncome = useMemo(() => 
    incomeGroups.reduce((sum, g) => sum + g.totalAmount, 0),
    [incomeGroups]
  );
  const totalExpenseCount = useMemo(() => 
    expenseGroups.reduce((sum, g) => sum + g.recordCount, 0),
    [expenseGroups]
  );
  const totalIncomeCount = useMemo(() => 
    incomeGroups.reduce((sum, g) => sum + g.recordCount, 0),
    [incomeGroups]
  );
  
  const handleRecordClick = (recordId: string) => {
    navigate(`/records`);
  };
  
  const toggleType = (direction: Direction, type: EventType) => {
    const key = `${direction}-${type}`;
    setExpandedTypes(prev => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };
  
  const isTypeExpanded = (direction: Direction, type: EventType) => {
    return expandedTypes.has(`${direction}-${type}`);
  };
  
  const hasData = expenseGroups.length > 0 || incomeGroups.length > 0;
  
  if (!hasData) {
    return (
      <div className="card p-8 text-center">
        <div className="text-5xl mb-4">📋</div>
        <p className="text-ink-400 dark:text-ink-500">暂无记录数据</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {expenseGroups.length > 0 && (
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-ink-800 dark:text-ink-200 flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-primary-500" />
              支出明细
            </h3>
            <div className="text-right">
              <span className="text-xs text-ink-400 dark:text-ink-500">{totalExpenseCount} 笔 · 共 </span>
              <span className="font-bold text-primary-500">{formatMoney(totalExpense, showCents)}</span>
            </div>
          </div>
          
          <div className="space-y-3">
            {expenseGroups.map(group => (
              <TypeGroupSection
                key={`expense-${group.type}`}
                group={group}
                direction="expense"
                isExpanded={isTypeExpanded('expense', group.type)}
                onToggle={() => toggleType('expense', group.type)}
                showCents={showCents}
                onRecordClick={handleRecordClick}
              />
            ))}
          </div>
        </div>
      )}
      
      {incomeGroups.length > 0 && (
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-ink-800 dark:text-ink-200 flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-500" />
              收入明细
            </h3>
            <div className="text-right">
              <span className="text-xs text-ink-400 dark:text-ink-500">{totalIncomeCount} 笔 · 共 </span>
              <span className="font-bold text-emerald-500">{formatMoney(totalIncome, showCents)}</span>
            </div>
          </div>
          
          <div className="space-y-3">
            {incomeGroups.map(group => (
              <TypeGroupSection
                key={`income-${group.type}`}
                group={group}
                direction="income"
                isExpanded={isTypeExpanded('income', group.type)}
                onToggle={() => toggleType('income', group.type)}
                showCents={showCents}
                onRecordClick={handleRecordClick}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
