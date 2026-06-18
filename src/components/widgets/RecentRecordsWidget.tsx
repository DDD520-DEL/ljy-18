import { useMemo } from 'react';
import { useGiftStore } from '@/store/useGiftStore';
import { formatMoney } from '@/utils/money';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, TrendingUp, TrendingDown } from 'lucide-react';
import { EVENT_TYPE_ICONS, type GiftRecord } from '@/types';

interface RecentRecordsWidgetProps {
  size?: 'small' | 'medium' | 'large';
  limit?: number;
}

export default function RecentRecordsWidget({ size = 'medium', limit }: RecentRecordsWidgetProps) {
  const navigate = useNavigate();
  const getRecentRecords = useGiftStore(state => state.getRecentRecords);
  const showCents = useGiftStore(state => state.preferences.showCents);

  const displayCount = size === 'large' ? 10 : size === 'medium' ? 6 : 3;
  const fetchCount = limit || displayCount;

  const allRecords = useMemo(() => {
    return getRecentRecords(100);
  }, [getRecentRecords]);

  const recentRecords = useMemo(() => {
    return allRecords.slice(0, fetchCount);
  }, [allRecords, fetchCount]);

  const displayRecords = useMemo(() => {
    return recentRecords.slice(0, displayCount);
  }, [recentRecords, displayCount]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return '今天';
    if (diffDays === 1) return '昨天';
    if (diffDays < 7) return `${diffDays}天前`;
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };

  const hasRecords = allRecords.length > 0;
  const hasMoreRecords = allRecords.length > displayCount;

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 space-y-1.5 overflow-hidden">
        {displayRecords.length > 0 ? (
          displayRecords.map((record) => (
            <RecordRow 
              key={record.id} 
              record={record} 
              formatDate={formatDate}
              showCents={showCents}
              compact={size === 'small'}
              onClick={() => navigate(`/records/${record.id}/edit`)}
            />
          ))
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-ink-300 dark:text-ink-600">
            <p className="text-3xl mb-2">📋</p>
            <p className={`${size === 'small' ? 'text-xs' : 'text-sm'}`}>暂无记录</p>
          </div>
        )}
      </div>
      
      {hasRecords && hasMoreRecords && (
        <button
          onClick={() => navigate('/records')}
          className={`mt-3 w-full py-2 text-center text-sm text-primary-500 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors font-medium flex items-center justify-center gap-1 ${
            size === 'small' ? 'py-1 text-xs' : ''
          }`}
        >
          查看全部 {allRecords.length} 条记录
          <ArrowRight size={size === 'small' ? 12 : 14} />
        </button>
      )}
    </div>
  );
}

interface RecordRowProps {
  record: GiftRecord;
  formatDate: (date: string) => string;
  showCents: boolean;
  compact?: boolean;
  onClick: () => void;
}

function RecordRow({ record, formatDate, showCents, compact, onClick }: RecordRowProps) {
  const isExpense = record.direction === 'expense';

  return (
    <div 
      onClick={onClick}
      className={`flex items-center gap-3 rounded-lg hover:bg-cream-50 dark:hover:bg-ink-800 cursor-pointer transition-colors ${
        compact ? 'p-1.5' : 'p-2'
      }`}
    >
      <div className={`${
        compact ? 'w-6 h-6' : 'w-8 h-8'
      } rounded-lg flex items-center justify-center flex-shrink-0 ${
        isExpense ? 'bg-red-50 dark:bg-red-900/20' : 'bg-emerald-50 dark:bg-emerald-900/20'
      }`}>
        <span className={compact ? 'text-sm' : 'text-base'}>{EVENT_TYPE_ICONS[record.eventType]}</span>
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={`${
            compact ? 'text-xs' : 'text-sm'
          } font-medium text-ink-800 dark:text-ink-200 truncate`}>
            {record.contactName}
          </span>
        </div>
        {!compact && (
          <div className="flex items-center gap-2 text-xs text-ink-400 dark:text-ink-500">
            <span>{formatDate(record.date)}</span>
            <span className="text-ink-300 dark:text-ink-600">·</span>
            <span className="truncate">{record.eventName}</span>
          </div>
        )}
      </div>
      
      <div className="flex items-center gap-1 flex-shrink-0">
        {isExpense ? (
          <TrendingUp size={compact ? 12 : 14} className="text-red-500" />
        ) : (
          <TrendingDown size={compact ? 12 : 14} className="text-emerald-500" />
        )}
        <span className={`tabular-nums font-semibold ${
          compact ? 'text-xs' : 'text-sm'
        } ${isExpense ? 'text-red-500' : 'text-emerald-500'}`}>
          {isExpense ? '-' : '+'}{formatMoney(record.amount, showCents)}
        </span>
      </div>
    </div>
  );
}
