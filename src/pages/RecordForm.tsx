import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useGiftStore } from '@/store/useGiftStore';
import { EVENT_TYPE_LABELS, EVENT_TYPE_ICONS, type EventType, type Direction } from '@/types';
import { getTodayStr, formatDate } from '@/utils/date';
import { formatMoney } from '@/utils/money';
import { ArrowLeft, Save, Lightbulb, Gift } from 'lucide-react';

export default function RecordForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;
  
  const addRecord = useGiftStore(state => state.addRecord);
  const updateRecord = useGiftStore(state => state.updateRecord);
  const getRecordById = useGiftStore(state => state.getRecordById);
  const getGiftSuggestion = useGiftStore(state => state.getGiftSuggestion);
  
  const [contactName, setContactName] = useState('');
  const [eventType, setEventType] = useState<EventType>('wedding');
  const [eventName, setEventName] = useState('');
  const [amount, setAmount] = useState('');
  const [direction, setDirection] = useState<Direction>('expense');
  const [date, setDate] = useState(getTodayStr());
  const [note, setNote] = useState('');
  const [showSuggestion, setShowSuggestion] = useState(false);
  
  const suggestion = direction === 'expense' && contactName.trim() 
    ? getGiftSuggestion(contactName.trim()) 
    : null;
  
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
      } else {
        navigate('/records');
      }
    }
  }, [isEdit, id, getRecordById, navigate]);
  
  useEffect(() => {
    if (suggestion?.hasHistory && direction === 'expense') {
      setShowSuggestion(true);
    } else {
      setShowSuggestion(false);
    }
  }, [suggestion, direction]);
  
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
    };
    
    if (isEdit && id) {
      updateRecord(id, recordData);
    } else {
      addRecord(recordData);
    }
    
    navigate('/records');
  };
  
  const applySuggestion = () => {
    if (suggestion) {
      setAmount(suggestion.suggestedAmount.toString());
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
        <h1 className="text-2xl font-serif font-bold text-ink-800">
          {isEdit ? '编辑记录' : '添加记录'}
        </h1>
      </div>
      
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
                  {formatMoney(suggestion.lastIncomeAmount)}
                </span>
              </p>
              <p className="text-sm text-gold-600">
                建议回礼不低于 
                <span className="font-bold text-gold-700">
                  {formatMoney(suggestion.suggestedAmount)}
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
        
        <button
          type="submit"
          className="w-full py-3.5 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white rounded-xl font-semibold shadow-lg shadow-primary-500/30 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
        >
          <Save size={20} />
          {isEdit ? '保存修改' : '保存记录'}
        </button>
      </form>
      
      <div className="h-20 md:hidden" />
    </div>
  );
}
