import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGiftStore } from '@/store/useGiftStore';
import { Search, ArrowUpDown, ChevronRight, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { formatMoney } from '@/utils/money';
import { formatDateShort } from '@/utils/date';
import type { ContactSummary } from '@/types';

export default function Contacts() {
  const navigate = useNavigate();
  const getContactSummaryList = useGiftStore(state => state.getContactSummaryList);
  
  const [searchText, setSearchText] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'expense' | 'income' | 'balance'>('date');
  
  const contacts = getContactSummaryList();
  
  const filteredContacts = useMemo(() => {
    let result = [...contacts];
    
    if (searchText) {
      const text = searchText.toLowerCase();
      result = result.filter(c => c.name.toLowerCase().includes(text));
    }
    
    switch (sortBy) {
      case 'date':
        result.sort((a, b) => 
          new Date(b.lastRecordDate).getTime() - new Date(a.lastRecordDate).getTime()
        );
        break;
      case 'expense':
        result.sort((a, b) => b.totalExpense - a.totalExpense);
        break;
      case 'income':
        result.sort((a, b) => b.totalIncome - a.totalIncome);
        break;
      case 'balance':
        result.sort((a, b) => b.balance - a.balance);
        break;
    }
    
    return result;
  }, [contacts, searchText, sortBy]);
  
  const getAvatarColor = (name: string) => {
    const colors = [
      'from-primary-400 to-primary-600',
      'from-gold-400 to-gold-600',
      'from-emerald-400 to-emerald-600',
      'from-blue-400 to-blue-600',
      'from-purple-400 to-purple-600',
      'from-pink-400 to-pink-600',
    ];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };
  
  const getBalanceStatus = (balance: number) => {
    if (balance > 0) {
      return { text: '我随出多', color: 'text-primary-500', icon: TrendingUp };
    } else if (balance < 0) {
      return { text: '对方随出多', color: 'text-emerald-500', icon: TrendingDown };
    }
    return { text: '持平', color: 'text-ink-400', icon: Minus };
  };
  
  const handleSort = () => {
    const orders: typeof sortBy[] = ['date', 'expense', 'income', 'balance'];
    const idx = orders.indexOf(sortBy);
    setSortBy(orders[(idx + 1) % orders.length]);
  };
  
  const getSortLabel = () => {
    const labels: Record<typeof sortBy, string> = {
      date: '最近往来',
      expense: '支出最多',
      income: '收入最多',
      balance: '收支差额',
    };
    return labels[sortBy];
  };
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-serif font-bold text-ink-800">
          人情往来
        </h1>
      </div>
      
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-xl p-4 shadow-sm text-center">
          <p className="text-2xl font-bold text-ink-800">{contacts.length}</p>
          <p className="text-xs text-ink-400 mt-1">往来对象</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm text-center">
          <p className="text-2xl font-bold text-primary-500 tabular-nums">
            {formatMoney(contacts.reduce((sum, c) => sum + c.totalExpense, 0)).replace('¥', '')}
          </p>
          <p className="text-xs text-ink-400 mt-1">总支出</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm text-center">
          <p className="text-2xl font-bold text-emerald-500 tabular-nums">
            {formatMoney(contacts.reduce((sum, c) => sum + c.totalIncome, 0)).replace('¥', '')}
          </p>
          <p className="text-xs text-ink-400 mt-1">总收入</p>
        </div>
      </div>
      
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-300" size={18} />
          <input
            type="text"
            placeholder="搜索姓名..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-cream-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
          />
        </div>
        <button
          onClick={handleSort}
          className="px-4 py-2.5 bg-white border border-cream-200 rounded-xl text-ink-500 hover:bg-cream-50 transition-all flex items-center gap-2 text-sm"
        >
          <ArrowUpDown size={16} />
          {getSortLabel()}
        </button>
      </div>
      
      <div className="space-y-3">
        {filteredContacts.length > 0 ? (
          filteredContacts.map((contact) => (
            <ContactCard
              key={contact.name}
              contact={contact}
              avatarColor={getAvatarColor(contact.name)}
              balanceStatus={getBalanceStatus(contact.balance)}
              onClick={() => navigate(`/contacts/${encodeURIComponent(contact.name)}`)}
            />
          ))
        ) : (
          <div className="text-center py-16 text-ink-300">
            <p className="text-5xl mb-3">👥</p>
            <p className="text-lg">暂无往来记录</p>
          </div>
        )}
      </div>
      
      <div className="h-20 md:hidden" />
    </div>
  );
}

interface ContactCardProps {
  contact: ContactSummary;
  avatarColor: string;
  balanceStatus: { text: string; color: string; icon: typeof Minus };
  onClick: () => void;
}

function ContactCard({ contact, avatarColor, balanceStatus, onClick }: ContactCardProps) {
  const StatusIcon = balanceStatus.icon;
  const maxAmount = Math.max(contact.totalExpense, contact.totalIncome, 1);
  const expensePercent = (contact.totalExpense / maxAmount) * 100;
  const incomePercent = (contact.totalIncome / maxAmount) * 100;
  
  return (
    <div
      onClick={onClick}
      className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-all cursor-pointer active:scale-[0.99]"
    >
      <div className="flex items-start gap-4">
        <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${avatarColor} flex items-center justify-center text-white font-bold text-lg shadow-md flex-shrink-0`}>
          {contact.name.charAt(0)}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-ink-800 truncate">{contact.name}</h3>
            <ChevronRight size={18} className="text-ink-300 flex-shrink-0" />
          </div>
          
          <p className="text-xs text-ink-400 mt-0.5">
            共 {contact.recordCount} 次往来 · 最近 {formatDateShort(contact.lastRecordDate)}
          </p>
          
          <div className="mt-3 space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xs text-ink-500 w-14">我随出</span>
              <div className="flex-1 h-2 bg-cream-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary-400 rounded-full transition-all duration-500"
                  style={{ width: `${expensePercent}%` }}
                />
              </div>
              <span className="text-xs font-medium text-primary-500 w-16 text-right tabular-nums">
                {formatMoney(contact.totalExpense)}
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-xs text-ink-500 w-14">对方随</span>
              <div className="flex-1 h-2 bg-cream-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-emerald-400 rounded-full transition-all duration-500"
                  style={{ width: `${incomePercent}%` }}
                />
              </div>
              <span className="text-xs font-medium text-emerald-500 w-16 text-right tabular-nums">
                {formatMoney(contact.totalIncome)}
              </span>
            </div>
          </div>
          
          <div className={`flex items-center gap-1 mt-3 text-xs ${balanceStatus.color}`}>
            <StatusIcon size={14} />
            <span>{balanceStatus.text}</span>
            <span className="font-medium tabular-nums">
              {Math.abs(contact.balance) > 0 ? formatMoney(Math.abs(contact.balance)) : ''}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
