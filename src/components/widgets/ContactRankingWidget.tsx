import { useMemo } from 'react';
import { useGiftStore } from '@/store/useGiftStore';
import { formatMoney } from '@/utils/money';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Clock, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import type { ContactSummary } from '@/types';

interface ContactRankingWidgetProps {
  size?: 'small' | 'medium' | 'large';
  limit?: number;
}

export default function ContactRankingWidget({ size = 'medium', limit }: ContactRankingWidgetProps) {
  const navigate = useNavigate();
  const getContactSummaryList = useGiftStore(state => state.getContactSummaryList);
  const showCents = useGiftStore(state => state.preferences.showCents);

  const displayCount = size === 'large' ? 10 : size === 'medium' ? 6 : 3;
  const fetchCount = limit || 100;

  const allContacts = useMemo(() => {
    const contacts = getContactSummaryList();
    return contacts
      .filter(c => c.lastRecordDate)
      .sort((a, b) => new Date(b.lastRecordDate).getTime() - new Date(a.lastRecordDate).getTime())
      .slice(0, fetchCount);
  }, [getContactSummaryList, fetchCount]);

  const displayContacts = useMemo(() => {
    return allContacts.slice(0, displayCount);
  }, [allContacts, displayCount]);

  const hasMoreContacts = allContacts.length > displayCount;

  const formatLastDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return '今天';
    if (diffDays === 1) return '昨天';
    if (diffDays < 7) return `${diffDays}天前`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}周前`;
    return `${Math.floor(diffDays / 30)}月前`;
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 space-y-2 overflow-hidden">
        {displayContacts.length > 0 ? (
          displayContacts.map((contact, index) => (
            <ContactRow 
              key={contact.name} 
              contact={contact} 
              rank={index + 1}
              formatLastDate={formatLastDate}
              showCents={showCents}
              onClick={() => navigate(`/contacts/${encodeURIComponent(contact.name)}`)}
            />
          ))
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-ink-300 dark:text-ink-600">
            <p className="text-3xl mb-2">👥</p>
            <p className="text-sm">暂无往来记录</p>
          </div>
        )}
      </div>
      
      {hasMoreContacts && (
        <button
          onClick={() => navigate('/contacts')}
          className={`mt-3 w-full py-2 text-center text-sm text-primary-500 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors font-medium flex items-center justify-center gap-1 ${
            size === 'small' ? 'py-1 text-xs' : ''
          }`}
        >
          查看全部 {allContacts.length} 位联系人
          <ArrowRight size={size === 'small' ? 12 : 14} />
        </button>
      )}
    </div>
  );
}

interface ContactRowProps {
  contact: ContactSummary;
  rank: number;
  formatLastDate: (date: string) => string;
  showCents: boolean;
  onClick: () => void;
}

function ContactRow({ contact, rank, formatLastDate, showCents, onClick }: ContactRowProps) {
  const getRankStyle = (r: number) => {
    if (r === 1) return 'bg-gradient-to-br from-amber-400 to-amber-500 text-white';
    if (r === 2) return 'bg-gradient-to-br from-gray-300 to-gray-400 text-white';
    if (r === 3) return 'bg-gradient-to-br from-amber-600 to-amber-700 text-white';
    return 'bg-ink-100 dark:bg-ink-700 text-ink-500 dark:text-ink-400';
  };

  return (
    <div 
      onClick={onClick}
      className="flex items-center gap-3 p-2 rounded-lg hover:bg-cream-50 dark:hover:bg-ink-800 cursor-pointer transition-colors group"
    >
      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${getRankStyle(rank)} flex-shrink-0`}>
        {rank}
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-ink-800 dark:text-ink-200 truncate">
            {contact.name}
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs text-ink-400 dark:text-ink-500">
          <Clock size={12} />
          <span>{formatLastDate(contact.lastRecordDate)}</span>
          <span className="text-ink-300 dark:text-ink-600">·</span>
          <span>{contact.recordCount}笔往来</span>
        </div>
      </div>
      
      <div className="text-right flex-shrink-0">
        <div className="flex items-center justify-end gap-1">
          {contact.balance >= 0 ? (
            <ArrowDownRight size={14} className="text-emerald-500" />
          ) : (
            <ArrowUpRight size={14} className="text-red-500" />
          )}
          <span className={`text-sm font-semibold tabular-nums ${
            contact.balance >= 0 ? 'text-emerald-500' : 'text-red-500'
          }`}>
            {formatMoney(Math.abs(contact.balance), showCents)}
          </span>
        </div>
        <div className="text-xs text-ink-400 dark:text-ink-500">
          净{contact.balance >= 0 ? '收入' : '支出'}
        </div>
      </div>
    </div>
  );
}
