import { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGiftStore } from '@/store/useGiftStore';
import { 
  Search, ArrowUpDown, ChevronRight, TrendingUp, TrendingDown, Minus, 
  Users, X, Check, Merge, Undo2, AlertCircle, CheckCircle2, Tag,
  Plus, Settings, Edit2, Trash2, FolderOpen, GripVertical
} from 'lucide-react';
import { formatMoney } from '@/utils/money';
import { formatDateShort } from '@/utils/date';
import { DEFAULT_TAGS, TAG_COLORS, type ContactSummary, type MergeResult, type ContactGroup, GROUP_COLORS, GROUP_ICONS } from '@/types';

interface ToastState {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
  showUndo?: boolean;
}

export default function Contacts() {
  const navigate = useNavigate();
  const getContactSummaryList = useGiftStore(state => state.getContactSummaryList);
  const getGroupSummaries = useGiftStore(state => state.getGroupSummaries);
  const getGroups = useGiftStore(state => state.getGroups);
  const addGroup = useGiftStore(state => state.addGroup);
  const editGroup = useGiftStore(state => state.editGroup);
  const removeGroup = useGiftStore(state => state.removeGroup);
  const mergeContacts = useGiftStore(state => state.mergeContacts);
  const undoLastMerge = useGiftStore(state => state.undoLastMerge);
  const preferences = useGiftStore(state => state.preferences);
  const groups = useGiftStore(state => state.groups);
  
  const showCents = preferences.showCents;
  
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);
  const [searchText, setSearchText] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'expense' | 'income' | 'balance'>('date');
  const [filterTags, setFilterTags] = useState<string[]>([]);
  const [showTagFilter, setShowTagFilter] = useState(false);
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
  const [selectedContacts, setSelectedContacts] = useState<Set<string>>(new Set());
  const [showMergeModal, setShowMergeModal] = useState(false);
  const [targetContactName, setTargetContactName] = useState('');
  const [toasts, setToasts] = useState<ToastState[]>([]);
  const [showGroupManager, setShowGroupManager] = useState(false);
  
  const contacts = getContactSummaryList();
  const groupSummaries = getGroupSummaries();
  
  const availableTags = useMemo(() => {
    const tagSet = new Set<string>(DEFAULT_TAGS);
    contacts.forEach(c => {
      c.records.forEach(r => {
        (r.tags || []).forEach(t => tagSet.add(t));
      });
    });
    return Array.from(tagSet);
  }, [contacts]);
  
  const filteredContacts = useMemo(() => {
    let result = [...contacts];
    
    if (activeGroupId !== null) {
      if (activeGroupId === '') {
        result = result.filter(c => !c.groupId);
      } else {
        result = result.filter(c => c.groupId === activeGroupId);
      }
    }
    
    if (searchText) {
      const text = searchText.toLowerCase();
      result = result.filter(c => c.name.toLowerCase().includes(text));
    }
    
    if (filterTags.length > 0) {
      result = result.filter(c => {
        const contactTags = new Set<string>();
        c.records.forEach(r => {
          (r.tags || []).forEach(t => contactTags.add(t));
        });
        return filterTags.every(t => contactTags.has(t));
      });
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
  }, [contacts, activeGroupId, searchText, filterTags, sortBy]);

  const selectedContactList = useMemo(() => {
    return filteredContacts.filter(c => selectedContacts.has(c.name));
  }, [filteredContacts, selectedContacts]);

  const currentGroupSummary = useMemo(() => {
    if (activeGroupId === null) {
      const allContacts = contacts;
      const totalExpense = allContacts.reduce((sum, c) => sum + c.totalExpense, 0);
      const totalIncome = allContacts.reduce((sum, c) => sum + c.totalIncome, 0);
      return {
        groupId: '',
        groupName: '全部',
        totalExpense,
        totalIncome,
        balance: totalExpense - totalIncome,
        contactCount: allContacts.length,
        recordCount: allContacts.reduce((sum, c) => sum + c.recordCount, 0),
      };
    }
    if (activeGroupId === '') {
      const ungroupedContacts = contacts.filter(c => !c.groupId);
      const totalExpense = ungroupedContacts.reduce((sum, c) => sum + c.totalExpense, 0);
      const totalIncome = ungroupedContacts.reduce((sum, c) => sum + c.totalIncome, 0);
      return {
        groupId: '',
        groupName: '未分组',
        totalExpense,
        totalIncome,
        balance: totalExpense - totalIncome,
        contactCount: ungroupedContacts.length,
        recordCount: ungroupedContacts.reduce((sum, c) => sum + c.recordCount, 0),
      };
    }
    return groupSummaries.find(g => g.groupId === activeGroupId) || {
      groupId: activeGroupId,
      groupName: '',
      totalExpense: 0,
      totalIncome: 0,
      balance: 0,
      contactCount: 0,
      recordCount: 0,
    };
  }, [activeGroupId, contacts, groupSummaries]);

  useEffect(() => {
    if (!isMultiSelectMode) {
      setSelectedContacts(new Set());
    }
  }, [isMultiSelectMode]);

  const showToast = (message: string, type: ToastState['type'] = 'info', showUndo = false) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type, showUndo }]);
    if (!showUndo) {
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, 3000);
    }
  };

  const removeToast = (id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

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

  const toggleFilterTag = (tag: string) => {
    setFilterTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag) 
        : [...prev, tag]
    );
  };
  
  const clearFilterTags = () => setFilterTags([]);

  const toggleContactSelection = (name: string) => {
    setSelectedContacts(prev => {
      const next = new Set(prev);
      if (next.has(name)) {
        next.delete(name);
      } else {
        next.add(name);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedContacts.size === filteredContacts.length) {
      setSelectedContacts(new Set());
    } else {
      setSelectedContacts(new Set(filteredContacts.map(c => c.name)));
    }
  };

  const handleOpenMergeModal = () => {
    if (selectedContacts.size < 2) {
      showToast('请至少选择 2 个联系人进行合并', 'error');
      return;
    }
    setTargetContactName(selectedContactList[0]?.name || '');
    setShowMergeModal(true);
  };

  const handleConfirmMerge = () => {
    if (!targetContactName) {
      showToast('请选择目标联系人', 'error');
      return;
    }
    if (!selectedContacts.has(targetContactName)) {
      showToast('目标联系人必须在已选中的列表中', 'error');
      return;
    }

    const sourceNames = Array.from(selectedContacts).filter(n => n !== targetContactName);
    const result: MergeResult = mergeContacts(sourceNames, targetContactName);

    setShowMergeModal(false);
    setIsMultiSelectMode(false);
    setSelectedContacts(new Set());

    if (result.success) {
      showToast(result.message, 'success', true);
    } else {
      showToast(result.message, 'error');
    }
  };

  const handleUndoMerge = (toastId: number) => {
    const result = undoLastMerge();
    removeToast(toastId);
    if (result.success) {
      showToast(result.message, 'success');
    } else {
      showToast(result.message, 'error');
    }
  };

  const tabs = useMemo(() => {
    const result: Array<{ id: string | null; name: string; icon?: string; count: number }> = [
      { id: null, name: '全部', count: contacts.length }
    ];
    const ungroupedSummary = groupSummaries.find(s => s.groupId === '');
    const ungroupedCount = contacts.filter(c => !c.groupId).length;
    if (ungroupedCount > 0 || true) {
      result.push({
        id: '',
        name: '未分组',
        icon: '📁',
        count: ungroupedCount,
      });
    }
    groups.forEach(group => {
      const summary = groupSummaries.find(s => s.groupId === group.id);
      result.push({
        id: group.id,
        name: group.name,
        icon: group.icon,
        count: summary?.contactCount || 0,
      });
    });
    return result;
  }, [groups, groupSummaries, contacts]);
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-serif font-bold text-ink-800">
            人情往来
          </h1>
          {isMultiSelectMode && (
            <span className="px-2 py-0.5 bg-primary-100 text-primary-600 text-xs rounded-full font-medium">
              已选 {selectedContacts.size} 人
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowGroupManager(true)}
            className="p-2 bg-white border border-cream-200 rounded-xl text-ink-500 hover:bg-cream-50 transition-all"
            title="管理分组"
          >
            <Settings size={18} />
          </button>
          <button
            onClick={() => setIsMultiSelectMode(!isMultiSelectMode)}
            className={`px-3 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-1.5 ${
              isMultiSelectMode 
                ? 'bg-primary-500 text-white shadow-md' 
                : 'bg-white border border-cream-200 text-ink-500 hover:bg-cream-50'
            }`}
          >
            {isMultiSelectMode ? <X size={16} /> : <Users size={16} />}
            {isMultiSelectMode ? '取消' : '多选'}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl p-3 shadow-sm overflow-x-auto">
        <div className="flex gap-2 min-w-max">
          {tabs.map((tab) => (
            <button
              key={tab.id ?? 'all'}
              onClick={() => setActiveGroupId(tab.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 whitespace-nowrap ${
                activeGroupId === tab.id
                  ? 'bg-primary-500 text-white shadow-sm'
                  : 'bg-cream-50 text-ink-600 hover:bg-cream-100'
              }`}
            >
              {tab.icon && <span className="text-sm">{tab.icon}</span>}
              <span>{tab.name}</span>
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                activeGroupId === tab.id
                  ? 'bg-white/20 text-white'
                  : 'bg-white text-ink-400'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-xl p-4 shadow-sm text-center">
          <p className="text-2xl font-bold text-ink-800">{currentGroupSummary.contactCount}</p>
          <p className="text-xs text-ink-400 mt-1">{activeGroupId === null ? '往来对象' : '组内人数'}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm text-center">
          <p className="text-2xl font-bold text-primary-500 tabular-nums">
            {formatMoney(currentGroupSummary.totalExpense, showCents).replace('¥', '')}
          </p>
          <p className="text-xs text-ink-400 mt-1">总支出</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm text-center">
          <p className="text-2xl font-bold text-emerald-500 tabular-nums">
            {formatMoney(currentGroupSummary.totalIncome, showCents).replace('¥', '')}
          </p>
          <p className="text-xs text-ink-400 mt-1">总收入</p>
        </div>
      </div>

      {isMultiSelectMode && (
        <div className="bg-white rounded-xl p-3 shadow-sm flex items-center justify-between gap-3">
          <button
            onClick={toggleSelectAll}
            className="px-3 py-2 text-sm text-ink-600 hover:bg-cream-50 rounded-lg transition-all flex items-center gap-1.5"
          >
            {selectedContacts.size === filteredContacts.length ? (
              <Check size={16} className="text-primary-500" />
            ) : (
              <div className="w-4 h-4 border-2 border-ink-300 rounded" />
            )}
            全选
          </button>
          <button
            onClick={handleOpenMergeModal}
            disabled={selectedContacts.size < 2}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${
              selectedContacts.size >= 2
                ? 'bg-primary-500 text-white hover:bg-primary-600 shadow-sm'
                : 'bg-cream-100 text-ink-300 cursor-not-allowed'
            }`}
          >
            <Merge size={16} />
            合并联系人
          </button>
        </div>
      )}
      
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
          onClick={() => setShowTagFilter(!showTagFilter)}
          className={`px-4 py-2.5 rounded-xl border transition-all flex items-center gap-2 text-sm ${
            showTagFilter || filterTags.length > 0
              ? 'bg-primary-50 border-primary-200 text-primary-600'
              : 'bg-white border-cream-200 text-ink-500 hover:bg-cream-50'
          }`}
        >
          <Tag size={16} />
          <span className="hidden md:inline">标签</span>
          {filterTags.length > 0 && (
            <span className="bg-primary-500 text-white text-xs px-1.5 py-0.5 rounded-full">
              {filterTags.length}
            </span>
          )}
        </button>
        <button
          onClick={handleSort}
          className="px-4 py-2.5 bg-white border border-cream-200 rounded-xl text-ink-500 hover:bg-cream-50 transition-all flex items-center gap-2 text-sm"
        >
          <ArrowUpDown size={16} />
          {getSortLabel()}
        </button>
      </div>
      
      {showTagFilter && (
        <div className="bg-white rounded-xl p-4 shadow-sm animate-slide-up">
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-medium text-ink-600 flex items-center gap-1.5">
              <Tag size={14} />
              按标签筛选联系人
            </label>
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
          {availableTags.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {availableTags.map(tag => {
                const selected = filterTags.includes(tag);
                return (
                  <button
                    key={tag}
                    onClick={() => toggleFilterTag(tag)}
                    className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
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
          ) : (
            <p className="text-xs text-ink-400">暂无可用标签</p>
          )}
          {filterTags.length > 0 && (
            <p className="text-xs text-ink-400 mt-3">已选 {filterTags.length} 个标签（联系人含任意已选标签的记录均显示，需同时满足）</p>
          )}
        </div>
      )}
      
      <div className="space-y-3">
        {filteredContacts.length > 0 ? (
          filteredContacts.map((contact) => (
            <ContactCard
              key={contact.name}
              contact={contact}
              avatarColor={getAvatarColor(contact.name)}
              balanceStatus={getBalanceStatus(contact.balance)}
              isMultiSelectMode={isMultiSelectMode}
              isSelected={selectedContacts.has(contact.name)}
              onToggleSelect={() => toggleContactSelection(contact.name)}
              onClick={() => {
                if (isMultiSelectMode) {
                  toggleContactSelection(contact.name);
                } else {
                  navigate(`/contacts/${encodeURIComponent(contact.name)}`);
                }
              }}
              onGroupChange={() => {
                setActiveGroupId(prev => prev);
              }}
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

      {showMergeModal && (
        <MergeConfirmModal
          selectedContacts={selectedContactList}
          targetContactName={targetContactName}
          onTargetChange={setTargetContactName}
          onCancel={() => setShowMergeModal(false)}
          onConfirm={handleConfirmMerge}
        />
      )}

      {showGroupManager && (
        <GroupManagerModal
          groups={groups}
          onClose={() => setShowGroupManager(false)}
        />
      )}

      <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 w-full max-w-md px-4">
        {toasts.map(toast => (
          <Toast
            key={toast.id}
            toast={toast}
            onClose={() => removeToast(toast.id)}
            onUndo={() => handleUndoMerge(toast.id)}
          />
        ))}
      </div>
    </div>
  );
}

interface ContactCardProps {
  contact: ContactSummary;
  avatarColor: string;
  balanceStatus: { text: string; color: string; icon: typeof Minus };
  isMultiSelectMode: boolean;
  isSelected: boolean;
  onToggleSelect: () => void;
  onClick: () => void;
  onGroupChange?: () => void;
}

function ContactCard({ 
  contact, 
  avatarColor, 
  balanceStatus, 
  isMultiSelectMode,
  isSelected,
  onToggleSelect,
  onClick,
  onGroupChange
}: ContactCardProps) {
  const preferences = useGiftStore(state => state.preferences);
  const groups = useGiftStore(state => state.groups);
  const setContactGroup = useGiftStore(state => state.setContactGroup);
  const showCents = preferences.showCents;
  const StatusIcon = balanceStatus.icon;
  const maxAmount = Math.max(contact.totalExpense, contact.totalIncome, 1);
  const expensePercent = (contact.totalExpense / maxAmount) * 100;
  const incomePercent = (contact.totalIncome / maxAmount) * 100;
  const [showGroupMenu, setShowGroupMenu] = useState(false);
  const groupMenuRef = useRef<HTMLDivElement>(null);
  const [, forceUpdate] = useState(0);
  
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (groupMenuRef.current && !groupMenuRef.current.contains(e.target as Node)) {
        setShowGroupMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  const contactTags = useMemo(() => {
    const tagSet = new Set<string>();
    contact.records.forEach(r => {
      (r.tags || []).forEach(t => tagSet.add(t));
    });
    return Array.from(tagSet).slice(0, 4);
  }, [contact.records]);
  
  const currentGroup = contact.groupId ? groups.find(g => g.id === contact.groupId) : null;
  
  const handleSetGroup = (groupId: string | null) => {
    setContactGroup(contact.name, groupId);
    setShowGroupMenu(false);
    forceUpdate(n => n + 1);
    onGroupChange?.();
  };
  
  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-xl p-4 shadow-sm transition-all active:scale-[0.99] ${
        isMultiSelectMode 
          ? isSelected 
            ? 'ring-2 ring-primary-500 bg-primary-50/50 hover:shadow-md' 
            : 'hover:bg-cream-50 cursor-pointer'
          : 'hover:shadow-md cursor-pointer'
      }`}
    >
      <div className="flex items-start gap-4">
        <div className="relative flex-shrink-0">
          <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${avatarColor} flex items-center justify-center text-white font-bold text-lg shadow-md`}>
            {contact.name.charAt(0)}
          </div>
          {isMultiSelectMode && (
            <div 
              className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                isSelected 
                  ? 'bg-primary-500 border-primary-500' 
                  : 'bg-white border-ink-200'
              }`}
              onClick={(e) => {
                e.stopPropagation();
                onToggleSelect();
              }}
            >
              {isSelected && <Check size={12} className="text-white" />}
            </div>
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <h3 className="font-semibold text-ink-800 truncate">{contact.name}</h3>
              {!isMultiSelectMode && (
                <div className="relative flex-shrink-0" ref={groupMenuRef}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowGroupMenu(!showGroupMenu);
                    }}
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] transition-all hover:opacity-80 ${
                      currentGroup 
                        ? `bg-gradient-to-r ${currentGroup.color} text-white shadow-sm`
                        : 'bg-cream-100 text-ink-500 hover:bg-cream-200'
                    }`}
                  >
                    {currentGroup ? (
                      <>
                        <span>{currentGroup.icon}</span>
                        <span>{currentGroup.name}</span>
                      </>
                    ) : (
                      <>
                        <FolderOpen size={10} />
                        <span>未分组</span>
                      </>
                    )}
                  </button>
                  {showGroupMenu && (
                    <div className="absolute z-30 top-full left-0 mt-1 bg-white rounded-xl shadow-xl border border-cream-200 py-1 min-w-[140px] animate-in fade-in slide-in-from-top-2 duration-200">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSetGroup(null);
                        }}
                        className={`w-full px-3 py-1.5 text-left text-xs flex items-center gap-1.5 hover:bg-cream-50 transition-all ${
                          !contact.groupId ? 'text-primary-600 bg-primary-50' : 'text-ink-600'
                        }`}
                      >
                        {!contact.groupId && <Check size={12} className="text-primary-500 flex-shrink-0" />}
                        <span className={!contact.groupId ? '' : 'ml-[22px]'}>未分组</span>
                      </button>
                      {groups.map(group => (
                        <button
                          key={group.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSetGroup(group.id);
                          }}
                          className={`w-full px-3 py-1.5 text-left text-xs flex items-center gap-1.5 hover:bg-cream-50 transition-all ${
                            contact.groupId === group.id ? 'text-primary-600 bg-primary-50' : 'text-ink-600'
                          }`}
                        >
                          {contact.groupId === group.id && <Check size={12} className="text-primary-500 flex-shrink-0" />}
                          <span className={contact.groupId === group.id ? '' : 'ml-[22px]'}>
                            <span className="mr-1">{group.icon}</span>
                            {group.name}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
            {!isMultiSelectMode && <ChevronRight size={18} className="text-ink-300 flex-shrink-0" />}
          </div>
          
          <p className="text-xs text-ink-400 mt-0.5">
            共 {contact.recordCount} 次往来 · 最近 {formatDateShort(contact.lastRecordDate)}
          </p>
          
          {contactTags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1.5">
              {contactTags.map(tag => (
                <span
                  key={tag}
                  className={`text-[10px] px-1.5 py-0.5 rounded-full ${TAG_COLORS[tag] || 'bg-primary-100 text-primary-600'}`}
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
          
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
                {formatMoney(contact.totalExpense, showCents)}
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
                {formatMoney(contact.totalIncome, showCents)}
              </span>
            </div>
          </div>
          
          <div className={`flex items-center gap-1 mt-3 text-xs ${balanceStatus.color}`}>
            <StatusIcon size={14} />
            <span>{balanceStatus.text}</span>
            <span className="font-medium tabular-nums">
              {Math.abs(contact.balance) > 0 ? formatMoney(Math.abs(contact.balance), showCents) : ''}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

interface MergeConfirmModalProps {
  selectedContacts: ContactSummary[];
  targetContactName: string;
  onTargetChange: (name: string) => void;
  onCancel: () => void;
  onConfirm: () => void;
}

function MergeConfirmModal({
  selectedContacts,
  targetContactName,
  onTargetChange,
  onCancel,
  onConfirm,
}: MergeConfirmModalProps) {
  const preferences = useGiftStore(state => state.preferences);
  const showCents = preferences.showCents;
  const totalRecords = selectedContacts.reduce((sum, c) => sum + c.recordCount, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="p-5 border-b border-cream-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center">
              <Merge size={20} className="text-primary-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-ink-800">合并联系人</h2>
              <p className="text-xs text-ink-400 mt-0.5">
                共 {selectedContacts.length} 人，{totalRecords} 条记录
              </p>
            </div>
          </div>
        </div>

        <div className="p-5 space-y-4">
          <div className="bg-amber-50 rounded-xl p-3.5 flex gap-2.5">
            <AlertCircle size={18} className="text-amber-500 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-amber-700 leading-relaxed">
              <p className="font-medium mb-1">合并后不可自动拆分（但可撤销本次操作）</p>
              <p>所有关联记录将归入目标联系人，统计数据会自动重新汇总。</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-ink-700 mb-2">
              选择保留的目标联系人
            </label>
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {selectedContacts.map((contact) => (
                <label
                  key={contact.name}
                  className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                    targetContactName === contact.name
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-cream-200 hover:border-cream-300 hover:bg-cream-50'
                  }`}
                >
                  <div 
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                      targetContactName === contact.name
                        ? 'border-primary-500 bg-primary-500'
                        : 'border-ink-200'
                    }`}
                  >
                    {targetContactName === contact.name && (
                      <Check size={12} className="text-white" />
                    )}
                  </div>
                  <input
                    type="radio"
                    name="targetContact"
                    value={contact.name}
                    checked={targetContactName === contact.name}
                    onChange={() => onTargetChange(contact.name)}
                    className="sr-only"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-ink-800 truncate">{contact.name}</p>
                    <p className="text-xs text-ink-400 mt-0.5">
                      {contact.recordCount} 条记录 · 收支差 {formatMoney(Math.abs(contact.balance), showCents)}
                    </p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {targetContactName && (
            <div className="bg-cream-50 rounded-xl p-3.5 text-xs text-ink-500">
              <p>
                「{selectedContacts.filter(c => c.name !== targetContactName).map(c => c.name).join('」、「')}」
                的 {selectedContacts.filter(c => c.name !== targetContactName).reduce((s, c) => s + c.recordCount, 0)} 条记录
                将合并到「{targetContactName}」
              </p>
            </div>
          )}
        </div>

        <div className="p-5 border-t border-cream-100 flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2.5 rounded-xl border border-cream-200 text-ink-600 font-medium hover:bg-cream-50 transition-all"
          >
            取消
          </button>
          <button
            onClick={onConfirm}
            disabled={!targetContactName}
            className={`flex-1 px-4 py-2.5 rounded-xl font-medium transition-all ${
              targetContactName
                ? 'bg-primary-500 text-white hover:bg-primary-600 shadow-sm'
                : 'bg-cream-100 text-ink-300 cursor-not-allowed'
            }`}
          >
            确认合并
          </button>
        </div>
      </div>
    </div>
  );
}

interface ToastProps {
  toast: ToastState;
  onClose: () => void;
  onUndo: () => void;
}

function Toast({ toast, onClose, onUndo }: ToastProps) {
  const bgColor = {
    success: 'bg-emerald-500',
    error: 'bg-red-500',
    info: 'bg-ink-700',
  }[toast.type];

  const Icon = toast.type === 'success' ? CheckCircle2 : AlertCircle;

  return (
    <div 
      className={`${bgColor} text-white rounded-xl shadow-xl p-3.5 flex items-center gap-3 animate-in slide-in-from-bottom-5 fade-in duration-300`}
    >
      <Icon size={20} className="flex-shrink-0" />
      <p className="text-sm flex-1 min-w-0 leading-snug">{toast.message}</p>
      {toast.showUndo && (
        <button
          onClick={onUndo}
          className="flex-shrink-0 px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-all flex items-center gap-1"
        >
          <Undo2 size={14} />
          撤销
        </button>
      )}
      {!toast.showUndo && (
        <button
          onClick={onClose}
          className="flex-shrink-0 p-1 hover:bg-white/20 rounded-lg transition-all"
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
}

interface GroupManagerModalProps {
  groups: ContactGroup[];
  onClose: () => void;
}

function GroupManagerModal({ groups, onClose }: GroupManagerModalProps) {
  const addGroup = useGiftStore(state => state.addGroup);
  const editGroup = useGiftStore(state => state.editGroup);
  const removeGroup = useGiftStore(state => state.removeGroup);
  const refreshGroups = useGiftStore(state => state.refreshGroups);
  
  const [editingGroup, setEditingGroup] = useState<ContactGroup | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [selectedColor, setSelectedColor] = useState(GROUP_COLORS[0]);
  const [selectedIcon, setSelectedIcon] = useState(GROUP_ICONS[0]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  const openAddModal = () => {
    setIsAdding(true);
    setEditingGroup(null);
    setGroupName('');
    setSelectedColor(GROUP_COLORS[0]);
    setSelectedIcon(GROUP_ICONS[0]);
  };

  const openEditModal = (group: ContactGroup) => {
    setIsAdding(false);
    setEditingGroup(group);
    setGroupName(group.name);
    setSelectedColor(group.color);
    setSelectedIcon(group.icon);
  };

  const handleSave = () => {
    if (!groupName.trim()) return;
    
    if (isAdding) {
      addGroup(groupName.trim(), selectedColor, selectedIcon);
    } else if (editingGroup) {
      editGroup(editingGroup.id, {
        name: groupName.trim(),
        color: selectedColor,
        icon: selectedIcon,
      });
    }
    
    setIsAdding(false);
    setEditingGroup(null);
    setGroupName('');
    refreshGroups();
  };

  const handleDelete = (groupId: string) => {
    removeGroup(groupId);
    setShowDeleteConfirm(null);
    refreshGroups();
  };

  const showForm = isAdding || editingGroup;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200 max-h-[80vh] flex flex-col">
        <div className="p-5 border-b border-cream-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center">
              <FolderOpen size={20} className="text-primary-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-ink-800">分组管理</h2>
              <p className="text-xs text-ink-400 mt-0.5">
                共 {groups.length} 个分组
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-cream-100 rounded-lg transition-all"
          >
            <X size={20} className="text-ink-500" />
          </button>
        </div>

        <div className="p-5 flex-1 overflow-y-auto">
          {!showForm ? (
            <div className="space-y-2">
              {groups.length > 0 ? (
                groups.map((group) => (
                  <div
                    key={group.id}
                    className="flex items-center gap-3 p-3 rounded-xl border border-cream-200 hover:bg-cream-50 transition-all"
                  >
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${group.color} flex items-center justify-center text-white text-lg shadow-sm`}>
                      {group.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-ink-800">{group.name}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEditModal(group)}
                        className="p-2 hover:bg-cream-100 rounded-lg transition-all text-ink-500"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => setShowDeleteConfirm(group.id)}
                        className="p-2 hover:bg-red-50 rounded-lg transition-all text-red-500"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-ink-300">
                  <p className="text-3xl mb-2">📁</p>
                  <p className="text-sm">暂无分组</p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-ink-700 mb-2">
                  分组名称
                </label>
                <input
                  type="text"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="输入分组名称"
                  className="w-full px-4 py-2.5 bg-white border border-cream-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-ink-700 mb-2">
                  选择图标
                </label>
                <div className="flex flex-wrap gap-2">
                  {GROUP_ICONS.map((icon) => (
                    <button
                      key={icon}
                      onClick={() => setSelectedIcon(icon)}
                      className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl transition-all ${
                        selectedIcon === icon
                          ? 'bg-primary-100 ring-2 ring-primary-500'
                          : 'bg-cream-50 hover:bg-cream-100'
                      }`}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-ink-700 mb-2">
                  选择颜色
                </label>
                <div className="flex flex-wrap gap-2">
                  {GROUP_COLORS.map((color) => (
                    <button
                      key={color}
                      onClick={() => setSelectedColor(color)}
                      className={`w-10 h-10 rounded-xl bg-gradient-to-br ${color} transition-all ${
                        selectedColor === color
                          ? 'ring-2 ring-offset-2 ring-primary-500'
                          : 'hover:scale-105'
                      }`}
                    />
                  ))}
                </div>
              </div>

              <div className="bg-cream-50 rounded-xl p-3 flex items-center gap-3">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${selectedColor} flex items-center justify-center text-white text-2xl shadow-sm`}>
                  {selectedIcon}
                </div>
                <div>
                  <p className="font-medium text-ink-800">
                    {groupName || '分组名称'}
                  </p>
                  <p className="text-xs text-ink-400">预览效果</p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="p-5 border-t border-cream-100 flex gap-3">
          {!showForm ? (
            <>
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2.5 rounded-xl border border-cream-200 text-ink-600 font-medium hover:bg-cream-50 transition-all"
              >
                关闭
              </button>
              <button
                onClick={openAddModal}
                className="flex-1 px-4 py-2.5 rounded-xl bg-primary-500 text-white font-medium hover:bg-primary-600 shadow-sm transition-all flex items-center justify-center gap-2"
              >
                <Plus size={18} />
                新建分组
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => {
                  setIsAdding(false);
                  setEditingGroup(null);
                }}
                className="flex-1 px-4 py-2.5 rounded-xl border border-cream-200 text-ink-600 font-medium hover:bg-cream-50 transition-all"
              >
                返回
              </button>
              <button
                onClick={handleSave}
                disabled={!groupName.trim()}
                className={`flex-1 px-4 py-2.5 rounded-xl font-medium transition-all flex items-center justify-center gap-2 ${
                  groupName.trim()
                    ? 'bg-primary-500 text-white hover:bg-primary-600 shadow-sm'
                    : 'bg-cream-100 text-ink-300 cursor-not-allowed'
                }`}
              >
                <Check size={18} />
                {isAdding ? '创建' : '保存'}
              </button>
            </>
          )}
        </div>
      </div>

      {showDeleteConfirm && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-5 text-center">
              <div className="w-14 h-14 mx-auto rounded-full bg-red-100 flex items-center justify-center mb-4">
                <AlertCircle size={28} className="text-red-500" />
              </div>
              <h3 className="text-lg font-bold text-ink-800 mb-2">确认删除分组？</h3>
              <p className="text-sm text-ink-500">
                删除后，该分组内的联系人将变为未分组状态，联系人记录不会被删除。
              </p>
            </div>
            <div className="p-5 border-t border-cream-100 flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-cream-200 text-ink-600 font-medium hover:bg-cream-50 transition-all"
              >
                取消
              </button>
              <button
                onClick={() => handleDelete(showDeleteConfirm)}
                className="flex-1 px-4 py-2.5 rounded-xl bg-red-500 text-white font-medium hover:bg-red-600 shadow-sm transition-all"
              >
                确认删除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
