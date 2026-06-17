import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useGiftStore } from '@/store/useGiftStore';
import { EVENT_TYPE_LABELS, EVENT_TYPE_ICONS, DEFAULT_TAGS, TAG_COLORS, type EventType, type Direction, type RecordTemplate } from '@/types';
import { getTodayStr, formatDate } from '@/utils/date';
import { formatMoney } from '@/utils/money';
import { ArrowLeft, Save, Lightbulb, Gift, AlertCircle, Tag, Plus, X, Image, Bookmark, Trash2, Star, FolderOpen, Check, ChevronDown } from 'lucide-react';
import ImageUploader from '@/components/ImageUploader';
import ImagePreview from '@/components/ImagePreview';

export default function RecordForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const isEdit = !!id;
  const dateFromUrl = searchParams.get('date');
  
  const addRecord = useGiftStore(state => state.addRecord);
  const updateRecord = useGiftStore(state => state.updateRecord);
  const getRecordById = useGiftStore(state => state.getRecordById);
  const getGiftSuggestion = useGiftStore(state => state.getGiftSuggestion);
  const checkMonthlyBudgetAfterExpense = useGiftStore(state => state.checkMonthlyBudgetAfterExpense);
  const getBudgetProgress = useGiftStore(state => state.getBudgetProgress);
  const preferences = useGiftStore(state => state.preferences);
  const templates = useGiftStore(state => state.templates);
  const addTemplate = useGiftStore(state => state.addTemplate);
  const removeTemplate = useGiftStore(state => state.removeTemplate);
  const toggleFavorite = useGiftStore(state => state.toggleFavorite);
  const getGroups = useGiftStore(state => state.getGroups);
  const getContactGroupId = useGiftStore(state => state.getContactGroupId);
  const setContactGroup = useGiftStore(state => state.setContactGroup);
  const refreshRecords = useGiftStore(state => state.refreshRecords);
  
  const [contactName, setContactName] = useState('');
  const [eventType, setEventType] = useState<EventType>('wedding');
  const [eventName, setEventName] = useState('');
  const [amount, setAmount] = useState('');
  const [direction, setDirection] = useState<Direction>(
    isEdit ? 'expense' : preferences.defaultDirection
  );
  const [date, setDate] = useState(dateFromUrl || getTodayStr());
  const [note, setNote] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [customTagInput, setCustomTagInput] = useState('');
  const [showSuggestion, setShowSuggestion] = useState(false);
  const [showBudgetWarning, setShowBudgetWarning] = useState(false);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [previewImages, setPreviewImages] = useState<{ urls: string[]; index: number } | null>(null);
  const [showSaveTemplateModal, setShowSaveTemplateModal] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [deleteTemplateId, setDeleteTemplateId] = useState<string | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [showGroupPicker, setShowGroupPicker] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [, forceUpdate] = useState(0);
  const groupPickerRef = useRef<HTMLDivElement>(null);
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressTemplateId = useRef<string | null>(null);
  const longPressFiredRef = useRef<boolean>(false);
  
  const showCents = preferences.showCents;
  
  const suggestion = direction === 'expense' && contactName.trim() 
    ? getGiftSuggestion(contactName.trim()) 
    : null;
  
  const budgetCheck = useMemo(() => {
    if (direction !== 'expense' || !amount || Number(amount) <= 0) {
      return null;
    }
    const recordYear = new Date(date).getFullYear();
    const recordMonth = new Date(date).getMonth();
    return checkMonthlyBudgetAfterExpense(recordYear, recordMonth, Number(amount));
  }, [direction, amount, date, checkMonthlyBudgetAfterExpense]);
  
  const currentYearBudget = useMemo(() => {
    return getBudgetProgress(new Date().getFullYear());
  }, [getBudgetProgress]);
  
  useEffect(() => {
    if (isEdit && id) {
      const record = getRecordById(id);
      if (record) {
        setContactName(record.contactName);
        setEventType(record.eventType);
        setEventName(record.eventName);
        setAmount(record.amount.toString());
        setDirection(record.direction);
        setDate(record.date);
        setNote(record.note);
        setTags(record.tags || []);
        setImageUrls(record.imageUrls || []);
        setIsFavorite(record.isFavorite || false);
      } else {
        navigate('/records');
      }
    } else if (dateFromUrl) {
      setDate(dateFromUrl);
    }
  }, [isEdit, id, dateFromUrl, getRecordById, navigate]);
  
  useEffect(() => {
    if (suggestion?.hasHistory && direction === 'expense') {
      setShowSuggestion(true);
    } else {
      setShowSuggestion(false);
    }
  }, [suggestion, direction]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (groupPickerRef.current && !groupPickerRef.current.contains(e.target as Node)) {
        setShowGroupPicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (contactName.trim()) {
      const groupId = getContactGroupId(contactName.trim());
      setSelectedGroupId(groupId);
      forceUpdate(n => n + 1);
    } else {
      setSelectedGroupId(null);
    }
  }, [contactName, getContactGroupId]);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!contactName.trim()) {
      alert('请输入对方姓名');
      return;
    }
    if (!amount || Number(amount) <= 0) {
      alert('请输入正确的金额');
      return;
    }
    
    const recordData = {
      contactName: contactName.trim(),
      eventType,
      eventName: eventName.trim() || EVENT_TYPE_LABELS[eventType],
      amount: Number(amount),
      direction,
      date,
      note: note.trim(),
      tags,
      imageUrls,
      isFavorite,
    };
    
    if (isEdit && id) {
      updateRecord(id, recordData);
    } else {
      addRecord(recordData);
    }

    if (contactName.trim()) {
      setContactGroup(contactName.trim(), selectedGroupId);
      refreshRecords();
    }
    
    if (direction === 'expense' && budgetCheck?.wouldExceed) {
      setShowBudgetWarning(true);
      setTimeout(() => {
        navigate('/records');
      }, 3000);
      return;
    }
    
    navigate('/records');
  };
  
  const applySuggestion = () => {
    if (suggestion) {
      setAmount(suggestion.suggestedAmount.toString());
    }
  };
  
  const toggleTag = (tag: string) => {
    setTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag) 
        : [...prev, tag]
    );
  };
  
  const addCustomTag = () => {
    const tag = customTagInput.trim();
    if (tag && !tags.includes(tag)) {
      setTags(prev => [...prev, tag]);
    }
    setCustomTagInput('');
  };
  
  const removeTag = (tag: string) => {
    setTags(prev => prev.filter(t => t !== tag));
  };

  const handleSaveTemplate = () => {
    if (!templateName.trim()) {
      alert('请输入模板名称');
      return;
    }
    if (!amount || Number(amount) <= 0) {
      alert('请先填写金额再保存模板');
      return;
    }
    addTemplate({
      name: templateName.trim(),
      eventType,
      eventName: eventName.trim() || EVENT_TYPE_LABELS[eventType],
      amount: Number(amount),
      direction,
      note: note.trim(),
      tags: [...tags],
    });
    setShowSaveTemplateModal(false);
    setTemplateName('');
  };

  const applyTemplate = (template: RecordTemplate) => {
    setEventType(template.eventType);
    setEventName(template.eventName);
    setAmount(template.amount.toString());
    setDirection(template.direction);
    setNote(template.note);
    setTags([...template.tags]);
  };

  const handleTemplateLongPressStart = (templateId: string) => {
    longPressTemplateId.current = templateId;
    longPressFiredRef.current = false;
    longPressTimerRef.current = setTimeout(() => {
      longPressFiredRef.current = true;
      setDeleteTemplateId(templateId);
    }, 500);
  };

  const handleTemplateLongPressEnd = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    longPressTemplateId.current = null;
  };

  const handleTemplateClick = (template: RecordTemplate) => {
    if (longPressFiredRef.current) {
      longPressFiredRef.current = false;
      return;
    }
    applyTemplate(template);
  };

  const confirmDeleteTemplate = () => {
    if (deleteTemplateId) {
      removeTemplate(deleteTemplateId);
      setDeleteTemplateId(null);
    }
  };
  
  return (
    <div className="max-w-lg mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-white rounded-lg transition-colors"
        >
          <ArrowLeft size={20} className="text-ink-600" />
        </button>
        <h1 className="text-2xl font-serif font-bold text-ink-800 flex-1">
          {isEdit ? '编辑记录' : '添加记录'}
        </h1>
        <button
          type="button"
          onClick={() => {
            if (isEdit && id) {
              const result = toggleFavorite(id);
              if (result) {
                setIsFavorite(result.isFavorite || false);
              }
            } else {
              setIsFavorite(!isFavorite);
            }
          }}
          className={`p-2.5 rounded-xl transition-all active:scale-90 ${
            isFavorite
              ? 'bg-amber-100 hover:bg-amber-200'
              : 'bg-cream-100 hover:bg-cream-200'
          }`}
          title={isFavorite ? '取消重点关注' : '标记为重点关注'}
        >
          <Star
            size={22}
            className={`transition-colors ${
              isFavorite
                ? 'fill-amber-400 text-amber-500'
                : 'text-ink-400'
            }`}
          />
        </button>
      </div>
      
      {showBudgetWarning && budgetCheck && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-slide-up">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-gold-100 rounded-full flex items-center justify-center mb-4">
                <AlertCircle size={32} className="text-gold-500" />
              </div>
              <h3 className="text-xl font-bold text-ink-800 mb-2">温和提醒</h3>
              <p className="text-ink-500 mb-4">
                本月支出已达到月均预算
              </p>
              <div className="w-full p-4 bg-cream-50 rounded-xl mb-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-ink-400">月均预算</span>
                  <span className="font-medium text-ink-700 tabular-nums">{formatMoney(budgetCheck.monthlyBudget, showCents)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-ink-400">本月已用</span>
                  <span className="font-medium text-gold-600 tabular-nums">{formatMoney(budgetCheck.currentMonthUsed, showCents)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-ink-400">本次支出</span>
                  <span className="font-medium text-primary-600 tabular-nums">{formatMoney(Number(amount), showCents)}</span>
                </div>
                <div className="pt-2 border-t border-cream-200 flex justify-between">
                  <span className="text-ink-400">本月累计</span>
                  <span className="font-bold text-red-500 tabular-nums">{formatMoney(budgetCheck.newTotal, showCents)}</span>
                </div>
              </div>
              <p className="text-sm text-ink-400 mb-4">
                记录已保存，请注意控制后续支出~
              </p>
              <button
                onClick={() => navigate('/records')}
                className="w-full py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl font-semibold"
              >
                我知道了
              </button>
            </div>
          </div>
        </div>
      )}
      
      {showSuggestion && suggestion && (
        <div className="mb-6 p-4 bg-gradient-to-r from-gold-50 to-yellow-50 border border-gold-200 rounded-2xl animate-slide-up">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-gold-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-gold">
              <Gift size={20} className="text-white" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-gold-700">回礼提示</span>
                <Lightbulb size={16} className="text-gold-500" />
              </div>
              <p className="text-sm text-gold-600 mt-1">
                {formatDate(suggestion.lastIncomeDate)} 对方随了 
                <span className="font-bold text-gold-700 mx-1">
                  {formatMoney(suggestion.lastIncomeAmount, showCents)}
                </span>
              </p>
              <p className="text-sm text-gold-600">
                建议回礼不低于 
                <span className="font-bold text-gold-700">
                  {formatMoney(suggestion.suggestedAmount, showCents)}
                </span>
              </p>
              <button
                onClick={applySuggestion}
                className="mt-3 px-4 py-1.5 bg-gold-500 hover:bg-gold-600 text-white text-sm font-medium rounded-lg transition-colors"
              >
                应用建议金额
              </button>
            </div>
          </div>
        </div>
      )}
      
      {direction === 'expense' && budgetCheck?.wouldExceed && !showBudgetWarning && (
        <div className="mb-6 p-4 bg-gradient-to-r from-gold-50 to-orange-50 border border-gold-200 rounded-2xl animate-slide-up">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-gold-500 rounded-xl flex items-center justify-center flex-shrink-0">
              <AlertCircle size={20} className="text-white" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-gold-700">预算提醒</p>
              <p className="text-sm text-gold-600 mt-1">
                添加这笔支出后，本月累计将超过月均预算 
                <span className="font-bold text-gold-700 mx-1">
                  {formatMoney(budgetCheck.newTotal - budgetCheck.monthlyBudget, showCents)}
                </span>
              </p>
              <p className="text-xs text-gold-500 mt-1">
                月均预算：{formatMoney(budgetCheck.monthlyBudget, showCents)} | 本月已用：{formatMoney(budgetCheck.currentMonthUsed, showCents)}
              </p>
            </div>
          </div>
        </div>
      )}
      
      {direction === 'expense' && currentYearBudget.budget > 0 && !budgetCheck?.wouldExceed && (
        <div className="mb-6 p-3 bg-cream-50 border border-cream-200 rounded-xl">
          <div className="flex items-center justify-between text-sm mb-1.5">
            <span className="text-ink-400">{new Date(date).getFullYear()}年预算进度</span>
            <span className={`font-medium ${
              currentYearBudget.percentage >= 80 ? 'text-gold-600' : 'text-ink-600'
            }`}>
              {currentYearBudget.percentage.toFixed(0)}%
            </span>
          </div>
          <div className="h-2 bg-cream-200 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                currentYearBudget.percentage >= 100
                  ? 'bg-red-500'
                  : currentYearBudget.percentage >= 80
                  ? 'bg-gold-500'
                  : 'bg-primary-500'
              }`}
              style={{ width: `${Math.min(currentYearBudget.percentage, 100)}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-ink-400 mt-1.5">
            <span>剩余 {formatMoney(currentYearBudget.remaining, showCents)}</span>
            <span>本月剩余 {formatMoney(currentYearBudget.currentMonthRemaining, showCents)}</span>
          </div>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="card p-6 space-y-5">
        <div>
          <label className="block text-sm font-medium text-ink-700 mb-2">
            收支方向
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setDirection('expense')}
              className={`py-3 px-4 rounded-xl font-medium transition-all ${
                direction === 'expense'
                  ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/30'
                  : 'bg-cream-100 text-ink-600 hover:bg-cream-200'
              }`}
            >
              <span className="text-lg">📤</span>
              <span className="block text-sm mt-1">我随出去的</span>
            </button>
            <button
              type="button"
              onClick={() => setDirection('income')}
              className={`py-3 px-4 rounded-xl font-medium transition-all ${
                direction === 'income'
                  ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
                  : 'bg-cream-100 text-ink-600 hover:bg-cream-200'
              }`}
            >
              <span className="text-lg">📥</span>
              <span className="block text-sm mt-1">对方回礼的</span>
            </button>
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-ink-700 mb-2">
            对方姓名/家庭 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={contactName}
            onChange={(e) => setContactName(e.target.value)}
            placeholder="请输入对方姓名或家庭名称"
            className="w-full px-4 py-3 bg-cream-50 border border-cream-200 rounded-xl text-ink-800 placeholder:text-ink-300 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
          />
          {contactName.trim() && (
            <div className="mt-2 relative" ref={groupPickerRef}>
              <button
                type="button"
                onClick={() => setShowGroupPicker(!showGroupPicker)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-cream-50 hover:bg-cream-100 rounded-lg text-xs text-ink-600 transition-all border border-cream-200"
              >
                <FolderOpen size={14} />
                <span>
                  {selectedGroupId 
                    ? getGroups().find(g => g.id === selectedGroupId)?.name || '未分组'
                    : '未分组'}
                </span>
                <ChevronDown size={14} className={`transition-transform ${showGroupPicker ? 'rotate-180' : ''}`} />
              </button>
              {showGroupPicker && (
                <div className="absolute z-20 top-full left-0 mt-1 bg-white rounded-xl shadow-xl border border-cream-200 py-1 min-w-[160px] animate-in fade-in slide-in-from-top-2 duration-200">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedGroupId(null);
                      setShowGroupPicker(false);
                      forceUpdate(n => n + 1);
                    }}
                    className={`w-full px-4 py-2 text-left text-sm flex items-center gap-2 hover:bg-cream-50 transition-all ${
                      !selectedGroupId ? 'text-primary-600 bg-primary-50' : 'text-ink-600'
                    }`}
                  >
                    {!selectedGroupId && <Check size={16} className="text-primary-500" />}
                    <span className={!selectedGroupId ? '' : 'ml-6'}>未分组</span>
                  </button>
                  {getGroups().map(group => (
                    <button
                      type="button"
                      key={group.id}
                      onClick={() => {
                        setSelectedGroupId(group.id);
                        setShowGroupPicker(false);
                        forceUpdate(n => n + 1);
                      }}
                      className={`w-full px-4 py-2 text-left text-sm flex items-center gap-2 hover:bg-cream-50 transition-all ${
                        selectedGroupId === group.id ? 'text-primary-600 bg-primary-50' : 'text-ink-600'
                      }`}
                    >
                      {selectedGroupId === group.id && <Check size={16} className="text-primary-500" />}
                      <span className={selectedGroupId === group.id ? '' : 'ml-6'}>
                        <span className="mr-1.5">{group.icon}</span>
                        {group.name}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
        
        <div>
          <label className="block text-sm font-medium text-ink-700 mb-2">
            事由类型
          </label>
          <div className="grid grid-cols-4 gap-2">
            {(Object.keys(EVENT_TYPE_LABELS) as EventType[]).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setEventType(type)}
                className={`py-2 px-2 rounded-xl text-center transition-all ${
                  eventType === type
                    ? 'bg-primary-50 text-primary-600 border-2 border-primary-500'
                    : 'bg-cream-50 text-ink-600 border-2 border-transparent hover:bg-cream-100'
                }`}
              >
                <span className="text-xl block">{EVENT_TYPE_ICONS[type]}</span>
                <span className="text-xs mt-1 block">{EVENT_TYPE_LABELS[type]}</span>
              </button>
            ))}
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-ink-700 mb-2">
            事由描述
          </label>
          <input
            type="text"
            value={eventName}
            onChange={(e) => setEventName(e.target.value)}
            placeholder={`如：${EVENT_TYPE_LABELS[eventType]}`}
            className="w-full px-4 py-3 bg-cream-50 border border-cream-200 rounded-xl text-ink-800 placeholder:text-ink-300 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-ink-700 mb-2">
            金额 (元) <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-400 text-xl">
              ¥
            </span>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              min="0"
              step="100"
              className="w-full pl-10 pr-4 py-4 bg-cream-50 border border-cream-200 rounded-xl text-2xl font-bold text-ink-800 placeholder:text-ink-300 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all tabular-nums"
            />
          </div>
          <div className="flex gap-2 mt-2">
            {[200, 500, 800, 1000].map((val) => (
              <button
                key={val}
                type="button"
                onClick={() => setAmount(val.toString())}
                className="px-3 py-1 text-sm bg-cream-100 hover:bg-cream-200 text-ink-600 rounded-lg transition-colors"
              >
                {val}
              </button>
            ))}
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-ink-700 mb-2">
            日期
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full px-4 py-3 bg-cream-50 border border-cream-200 rounded-xl text-ink-800 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-ink-700 mb-2">
            备注
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="添加一些备注信息..."
            rows={3}
            className="w-full px-4 py-3 bg-cream-50 border border-cream-200 rounded-xl text-ink-800 placeholder:text-ink-300 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all resize-none"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-ink-700 mb-2">
            <span className="flex items-center gap-1.5">
              <Tag size={16} />
              标签
            </span>
          </label>
          
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {tags.map(tag => (
                <span
                  key={tag}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${TAG_COLORS[tag] || 'bg-primary-100 text-primary-600'}`}
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="hover:bg-black/10 rounded-full p-0.5 transition-colors"
                  >
                    <X size={12} />
                  </button>
                </span>
              ))}
            </div>
          )}
          
          <div className="flex flex-wrap gap-2">
            {DEFAULT_TAGS.map(tag => {
              const selected = tags.includes(tag);
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    selected
                      ? TAG_COLORS[tag] || 'bg-primary-500 text-white'
                      : 'bg-cream-100 text-ink-500 hover:bg-cream-200'
                  }`}
                >
                  {tag}
                </button>
              );
            })}
          </div>
          
          <div className="flex gap-2 mt-3">
            <input
              type="text"
              value={customTagInput}
              onChange={(e) => setCustomTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addCustomTag();
                }
              }}
              placeholder="自定义标签..."
              className="flex-1 px-3 py-2 bg-cream-50 border border-cream-200 rounded-lg text-sm text-ink-800 placeholder:text-ink-300 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
            />
            <button
              type="button"
              onClick={addCustomTag}
              disabled={!customTagInput.trim()}
              className="px-3 py-2 bg-primary-50 hover:bg-primary-100 disabled:opacity-50 disabled:cursor-not-allowed text-primary-600 rounded-lg transition-all flex items-center gap-1"
            >
              <Plus size={16} />
              <span className="text-sm">添加</span>
            </button>
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-ink-700 mb-2">
            <span className="flex items-center gap-1.5">
              <Image size={16} />
              图片凭证
            </span>
          </label>
          <p className="text-xs text-ink-400 mb-3">添加红包截图、请柬照片等凭证</p>
          <ImageUploader
            imageUrls={imageUrls}
            onChange={setImageUrls}
            maxCount={9}
          />
        </div>

        <div className="border-t border-cream-200 pt-4">
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-medium text-ink-700 flex items-center gap-1.5">
              <Bookmark size={16} />
              快捷模板
            </label>
            <button
              type="button"
              onClick={() => {
                setTemplateName('');
                setShowSaveTemplateModal(true);
              }}
              className="text-xs text-primary-500 hover:text-primary-600 flex items-center gap-1"
            >
              <Plus size={14} />
              保存当前为模板
            </button>
          </div>
          
          {templates.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {templates.map((template) => (
                <button
                  key={template.id}
                  type="button"
                  onClick={() => handleTemplateClick(template)}
                  onMouseDown={() => handleTemplateLongPressStart(template.id)}
                  onMouseUp={handleTemplateLongPressEnd}
                  onMouseLeave={handleTemplateLongPressEnd}
                  onTouchStart={() => handleTemplateLongPressStart(template.id)}
                  onTouchEnd={handleTemplateLongPressEnd}
                  className={`group relative px-3 py-2 rounded-xl text-left transition-all select-none ${
                    template.direction === 'expense'
                      ? 'bg-primary-50 hover:bg-primary-100 border border-primary-200'
                      : 'bg-emerald-50 hover:bg-emerald-100 border border-emerald-200'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{EVENT_TYPE_ICONS[template.eventType]}</span>
                    <div>
                      <p className="text-sm font-medium text-ink-700">{template.name}</p>
                      <p className={`text-xs font-semibold tabular-nums ${
                        template.direction === 'expense' ? 'text-primary-600' : 'text-emerald-600'
                      }`}>
                        {template.direction === 'expense' ? '-' : '+'}{formatMoney(template.amount, showCents)}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <p className="text-xs text-ink-400 text-center py-3">
              暂无模板，点击上方按钮保存常用记账组合
            </p>
          )}
          
          <p className="text-xs text-ink-400 mt-2 text-center">
            💡 点击模板快速填入，长按可删除
          </p>
        </div>
        
        <button
          type="submit"
          className="w-full py-3.5 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white rounded-xl font-semibold shadow-lg shadow-primary-500/30 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
        >
          <Save size={20} />
          {isEdit ? '保存修改' : '保存记录'}
        </button>
      </form>
      
      <div className="h-20 md:hidden" />
      
      {showSaveTemplateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm animate-slide-up">
            <h3 className="text-lg font-semibold text-ink-800 mb-2">保存为模板</h3>
            <p className="text-sm text-ink-500 mb-4">
              将当前的记账组合保存为快捷模板，下次可一键填入
            </p>
            <input
              type="text"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              placeholder="请输入模板名称，如：同事婚礼"
              autoFocus
              className="w-full px-4 py-3 bg-cream-50 border border-cream-200 rounded-xl text-ink-800 placeholder:text-ink-300 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all mb-4"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSaveTemplate();
                }
              }}
            />
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowSaveTemplateModal(false);
                  setTemplateName('');
                }}
                className="flex-1 py-2.5 bg-cream-100 hover:bg-cream-200 text-ink-600 rounded-xl font-medium transition-colors"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleSaveTemplate}
                className="flex-1 py-2.5 bg-primary-500 hover:bg-primary-600 text-white rounded-xl font-medium transition-colors"
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteTemplateId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm animate-slide-up">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <Trash2 size={20} className="text-red-500" />
              </div>
              <h3 className="text-lg font-semibold text-ink-800">删除模板</h3>
            </div>
            <p className="text-sm text-ink-500 mb-6">
              确定要删除这个模板吗？删除后无法恢复。
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setDeleteTemplateId(null)}
                className="flex-1 py-2.5 bg-cream-100 hover:bg-cream-200 text-ink-600 rounded-xl font-medium transition-colors"
              >
                取消
              </button>
              <button
                type="button"
                onClick={confirmDeleteTemplate}
                className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl font-medium transition-colors"
              >
                删除
              </button>
            </div>
          </div>
        </div>
      )}
      
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
