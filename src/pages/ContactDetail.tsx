import { useState, useMemo, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGiftStore } from '@/store/useGiftStore';
import RecordItem from '@/components/RecordItem';
import ImagePreview from '@/components/ImagePreview';
import { ArrowLeft, TrendingUp, TrendingDown, Wallet, Gift, Tag, X, FolderOpen, Check, ChevronDown } from 'lucide-react';
import { formatMoney } from '@/utils/money';
import { formatDate } from '@/utils/date';
import { DEFAULT_TAGS, TAG_COLORS } from '@/types';

export default function ContactDetail() {
  const { name } = useParams();
  const navigate = useNavigate();
  const getContactDetail = useGiftStore(state => state.getContactDetail);
  const getGroups = useGiftStore(state => state.getGroups);
  const setContactGroup = useGiftStore(state => state.setContactGroup);
  const refreshRecords = useGiftStore(state => state.refreshRecords);
  const preferences = useGiftStore(state => state.preferences);
  const showCents = preferences.showCents;
  
  const [filterTags, setFilterTags] = useState<string[]>([]);
  const [previewImages, setPreviewImages] = useState<{ urls: string[]; index: number } | null>(null);
  const [showGroupPicker, setShowGroupPicker] = useState(false);
  const [, forceUpdate] = useState(0);
  const groupPickerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (groupPickerRef.current && !groupPickerRef.current.contains(e.target as Node)) {
        setShowGroupPicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  const contactName = name ? decodeURIComponent(name) : '';
  const contact = getContactDetail(contactName);
  
  const availableTags = useMemo(() => {
    if (!contact) return [];
    const tagSet = new Set<string>(DEFAULT_TAGS);
    contact.records.forEach(r => {
      (r.tags || []).forEach(t => tagSet.add(t));
    });
    return Array.from(tagSet).filter(t => 
      contact.records.some(r => (r.tags || []).includes(t))
    );
  }, [contact]);
  
  const filteredRecords = useMemo(() => {
    if (!contact) return [];
    if (filterTags.length === 0) return contact.records;
    return contact.records.filter(r => {
      const recordTags = r.tags || [];
      return filterTags.every(t => recordTags.includes(t));
    });
  }, [contact, filterTags]);
  
  const toggleFilterTag = (tag: string) => {
    setFilterTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag) 
        : [...prev, tag]
    );
  };
  
  const clearFilterTags = () => setFilterTags([]);
  
  if (!contact) {
    return (
      <div className="text-center py-20">
        <p className="text-4xl mb-3">🤔</p>
        <p className="text-ink-500">未找到该往来记录</p>
        <button
          onClick={() => navigate('/contacts')}
          className="mt-4 px-4 py-2 bg-primary-500 text-white rounded-lg"
        >
          返回
        </button>
      </div>
    );
  }
  
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
  
  const maxAmount = Math.max(contact.totalExpense, contact.totalIncome, 1);
  const expensePercent = (contact.totalExpense / maxAmount) * 100;
  const incomePercent = (contact.totalIncome / maxAmount) * 100;
  
  const balancePositive = contact.balance >= 0;
  
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="p-2 bg-white rounded-xl shadow-sm hover:shadow-md transition-all"
        >
          <ArrowLeft size={20} className="text-ink-600" />
        </button>
        <h1 className="text-xl font-serif font-bold text-ink-800">
          往来详情
        </h1>
      </div>
      
      <div className="card p-6">
        <div className="flex items-center gap-4">
          <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${getAvatarColor(contactName)} flex items-center justify-center text-white font-bold text-2xl shadow-lg`}>
            {contactName.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold text-ink-800">{contactName}</h2>
            <p className="text-ink-400 text-sm mt-0.5">
              共 {contact.recordCount} 次往来
            </p>
            <div className="mt-2 relative" ref={groupPickerRef}>
              <button
                onClick={() => setShowGroupPicker(!showGroupPicker)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-cream-50 hover:bg-cream-100 rounded-lg text-xs text-ink-600 transition-all"
              >
                <FolderOpen size={14} />
                <span>
                  {contact.groupId 
                    ? getGroups().find(g => g.id === contact.groupId)?.name || '未分组'
                    : '未分组'}
                </span>
                <ChevronDown size={14} className={`transition-transform ${showGroupPicker ? 'rotate-180' : ''}`} />
              </button>
              {showGroupPicker && (
                <div className="absolute z-20 top-full left-0 mt-1 bg-white rounded-xl shadow-xl border border-cream-200 py-1 min-w-[160px] animate-in fade-in slide-in-from-top-2 duration-200">
                  <button
                    onClick={() => {
                      setContactGroup(contactName, null);
                      refreshRecords();
                      setShowGroupPicker(false);
                      forceUpdate(n => n + 1);
                    }}
                    className={`w-full px-4 py-2 text-left text-sm flex items-center gap-2 hover:bg-cream-50 transition-all ${
                      !contact.groupId ? 'text-primary-600 bg-primary-50' : 'text-ink-600'
                    }`}
                  >
                    {!contact.groupId && <Check size={16} className="text-primary-500" />}
                    <span className={!contact.groupId ? '' : 'ml-6'}>未分组</span>
                  </button>
                  {getGroups().map(group => (
                    <button
                      key={group.id}
                      onClick={() => {
                        setContactGroup(contactName, group.id);
                        refreshRecords();
                        setShowGroupPicker(false);
                        forceUpdate(n => n + 1);
                      }}
                      className={`w-full px-4 py-2 text-left text-sm flex items-center gap-2 hover:bg-cream-50 transition-all ${
                        contact.groupId === group.id ? 'text-primary-600 bg-primary-50' : 'text-ink-600'
                      }`}
                    >
                      {contact.groupId === group.id && <Check size={16} className="text-primary-500" />}
                      <span className={contact.groupId === group.id ? '' : 'ml-6'}>
                        <span className="mr-1.5">{group.icon}</span>
                        {group.name}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-3 gap-4 mt-6">
          <div className="text-center">
            <div className="w-10 h-10 mx-auto bg-primary-100 rounded-xl flex items-center justify-center mb-2">
              <TrendingUp size={20} className="text-primary-500" />
            </div>
            <p className="text-lg font-bold text-primary-500 tabular-nums">
              {formatMoney(contact.totalExpense, showCents)}
            </p>
            <p className="text-xs text-ink-400 mt-1">我随出</p>
          </div>
          
          <div className="text-center">
            <div className="w-10 h-10 mx-auto bg-emerald-100 rounded-xl flex items-center justify-center mb-2">
              <TrendingDown size={20} className="text-emerald-500" />
            </div>
            <p className="text-lg font-bold text-emerald-500 tabular-nums">
              {formatMoney(contact.totalIncome, showCents)}
            </p>
            <p className="text-xs text-ink-400 mt-1">对方随来</p>
          </div>
          
          <div className="text-center">
            <div className={`w-10 h-10 mx-auto rounded-xl flex items-center justify-center mb-2 ${balancePositive ? 'bg-gold-100' : 'bg-blue-100'}`}>
              <Wallet size={20} className={balancePositive ? 'text-gold-500' : 'text-blue-500'} />
            </div>
            <p className={`text-lg font-bold tabular-nums ${balancePositive ? 'text-gold-500' : 'text-blue-500'}`}>
              {balancePositive ? '+' : '-'}{formatMoney(Math.abs(contact.balance), showCents).replace('¥', '')}
            </p>
            <p className="text-xs text-ink-400 mt-1">差额</p>
          </div>
        </div>
        
        <div className="mt-6 space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-ink-500">收支对比</span>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="text-xs text-ink-500 w-12">支出</span>
              <div className="flex-1 h-3 bg-cream-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-primary-400 to-primary-500 rounded-full transition-all duration-700"
                  style={{ width: `${expensePercent}%` }}
                />
              </div>
              <span className="text-xs font-medium text-primary-500 w-16 text-right tabular-nums">
                {formatMoney(contact.totalExpense, showCents)}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-ink-500 w-12">收入</span>
              <div className="flex-1 h-3 bg-cream-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full transition-all duration-700"
                  style={{ width: `${incomePercent}%` }}
                />
              </div>
              <span className="text-xs font-medium text-emerald-500 w-16 text-right tabular-nums">
                {formatMoney(contact.totalIncome, showCents)}
              </span>
            </div>
          </div>
        </div>
        
        {contact.lastIncomeAmount > 0 && (
          <div className="mt-6 p-4 bg-gradient-to-r from-gold-50 to-yellow-50 border border-gold-200 rounded-xl">
            <div className="flex items-center gap-2">
              <Gift size={18} className="text-gold-500" />
              <span className="text-sm font-medium text-gold-700">上次对方随礼</span>
            </div>
            <div className="mt-2">
              <p className="text-lg font-bold text-gold-600 tabular-nums">
                {formatMoney(contact.lastIncomeAmount, showCents)}
              </p>
              <p className="text-xs text-gold-500 mt-0.5">
                {formatDate(contact.lastIncomeDate)}
              </p>
            </div>
          </div>
        )}
      </div>
      
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-ink-800 flex items-center gap-2">
            <span className="text-lg">📋</span>
            往来记录
          </h3>
          {filterTags.length > 0 && (
            <span className="text-xs text-ink-400">
              显示 {filteredRecords.length}/{contact.records.length} 条
            </span>
          )}
        </div>
        
        {availableTags.length > 0 && (
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-ink-500 flex items-center gap-1">
                <Tag size={12} />
                按标签筛选
              </span>
              {filterTags.length > 0 && (
                <button
                  onClick={clearFilterTags}
                  className="text-xs text-ink-400 hover:text-primary-500 flex items-center gap-1"
                >
                  <X size={12} />
                  清除
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {availableTags.map(tag => {
                const selected = filterTags.includes(tag);
                return (
                  <button
                    key={tag}
                    onClick={() => toggleFilterTag(tag)}
                    className={`px-2.5 py-1 rounded-lg text-xs transition-all ${
                      selected
                        ? TAG_COLORS[tag] || 'bg-primary-500 text-white'
                        : 'bg-cream-100 text-ink-600 hover:bg-cream-200'
                    }`}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>
          </div>
        )}
        
        <div className="space-y-3">
          {filteredRecords.length > 0 ? (
            filteredRecords.map((record) => (
              <RecordItem
                key={record.id}
                record={record}
                onClick={() => navigate(`/records/${record.id}/edit`)}
                onImageClick={(urls, index) => setPreviewImages({ urls, index })}
              />
            ))
          ) : (
            <div className="text-center py-8 text-ink-300">
              <p className="text-3xl mb-2">🔍</p>
              <p className="text-sm">没有匹配所选标签的记录</p>
            </div>
          )}
        </div>
      </div>
      
      <div className="h-20 md:hidden" />
      
      {previewImages && (
        <ImagePreview
          images={previewImages.urls}
          initialIndex={previewImages.index}
          onClose={() => setPreviewImages(null)}
        />
      )}
    </div>
  );
}
