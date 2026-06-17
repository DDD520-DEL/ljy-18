import { useState } from 'react';
import { useGiftStore } from '@/store/useGiftStore';
import StatCard from '@/components/StatCard';
import RecordItem from '@/components/RecordItem';
import BudgetProgressCard from '@/components/BudgetProgressCard';
import ReminderCard from '@/components/ReminderCard';
import ImagePreview from '@/components/ImagePreview';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, TrendingDown, Wallet, Users, Plus, ArrowRight, Bell } from 'lucide-react';
import { formatMoneyShort } from '@/utils/money';

export default function Home() {
  const navigate = useNavigate();
  const [previewImages, setPreviewImages] = useState<{ urls: string[]; index: number } | null>(null);
  const getCurrentYearStats = useGiftStore(state => state.getCurrentYearStats);
  const getRecentRecords = useGiftStore(state => state.getRecentRecords);
  const getTotalStats = useGiftStore(state => state.getTotalStats);
  const getBudgetProgress = useGiftStore(state => state.getBudgetProgress);
  const getReturnGiftReminders = useGiftStore(state => state.getReturnGiftReminders);
  const getCurrentLedger = useGiftStore(state => state.getCurrentLedger);
  const preferences = useGiftStore(state => state.preferences);
  
  const yearStats = getCurrentYearStats();
  const recentRecords = getRecentRecords(preferences.recentRecordsCount);
  const totalStats = getTotalStats();
  const budgetProgress = getBudgetProgress(new Date().getFullYear());
  const reminders = getReturnGiftReminders();
  const currentLedger = getCurrentLedger();
  const showCents = preferences.showCents;
  
  const currentYear = new Date().getFullYear();
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="md:hidden">
          <h1 className="text-2xl md:text-3xl font-serif font-bold text-ink-800 flex items-center gap-2">
            <span className="text-2xl">{currentLedger?.icon || '🧧'}</span>
            {currentLedger?.name || '人情账本'}
          </h1>
          <p className="text-ink-400 mt-1 text-sm">
            {currentYear}年度人情往来概览
          </p>
        </div>
        <div className="hidden md:block">
          <h1 className="text-2xl md:text-3xl font-serif font-bold text-ink-800">
            人情账本
          </h1>
          <p className="text-ink-400 mt-1 text-sm">
            {currentYear}年度人情往来概览
          </p>
        </div>
        <button
          onClick={() => navigate('/records/add')}
          className="hidden md:flex items-center gap-2 px-5 py-2.5 bg-primary-500 hover:bg-primary-600 text-white rounded-xl font-medium shadow-lg shadow-primary-500/20 transition-all hover:shadow-xl hover:shadow-primary-500/30 active:scale-95"
        >
          <Plus size={20} />
          添加记录
        </button>
      </div>

      {reminders.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-ink-800 flex items-center gap-2">
              <Bell size={20} className="text-primary-500" />
              回礼提醒
              <span className="text-xs bg-primary-100 text-primary-600 px-2 py-0.5 rounded-full">
                {reminders.length} 条
              </span>
            </h2>
          </div>
          <div className="space-y-3">
            {reminders.slice(0, 5).map((reminder) => (
              <ReminderCard
                key={reminder.contactName}
                reminder={reminder}
                onClick={() => navigate(`/contacts/${encodeURIComponent(reminder.contactName)}`)}
              />
            ))}
            {reminders.length > 5 && (
              <button
                onClick={() => navigate('/contacts')}
                className="w-full py-3 text-center text-sm text-primary-500 hover:text-primary-600 font-medium"
              >
                查看全部 {reminders.length} 条提醒
              </button>
            )}
          </div>
        </div>
      )}
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="本年支出"
          value={formatMoneyShort(yearStats.totalExpense, showCents)}
          icon={<TrendingUp size={24} className="text-white" />}
          color="red"
        />
        <StatCard
          title="本年收入"
          value={formatMoneyShort(yearStats.totalIncome, showCents)}
          icon={<TrendingDown size={24} className="text-white" />}
          color="green"
        />
        <StatCard
          title="本年结余"
          value={formatMoneyShort(Math.abs(yearStats.balance), showCents)}
          icon={<Wallet size={24} className="text-white" />}
          color="gold"
          trend={yearStats.balance >= 0 ? '收入多' : '支出多'}
          trendUp={yearStats.balance >= 0}
        />
        <StatCard
          title="往来人数"
          value={`${totalStats.contactCount}人`}
          icon={<Users size={24} className="text-white" />}
          color="blue"
        />
      </div>
      
      <BudgetProgressCard progress={budgetProgress} />
      
      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-ink-800 flex items-center gap-2">
              <span className="text-xl">📋</span>
              最近记录
            </h2>
            <button
              onClick={() => navigate('/records')}
              className="text-sm text-primary-500 hover:text-primary-600 font-medium flex items-center gap-1 transition-colors"
            >
              查看全部
              <ArrowRight size={16} />
            </button>
          </div>
          
          <div className="space-y-3">
            {recentRecords.length > 0 ? (
              recentRecords.map((record) => (
                <RecordItem
                  key={record.id}
                  record={record}
                  onClick={() => navigate(`/records/${record.id}/edit`)}
                  onImageClick={(urls, index) => setPreviewImages({ urls, index })}
                />
              ))
            ) : (
              <div className="text-center py-12 text-ink-300">
                <p className="text-4xl mb-2">📝</p>
                <p>还没有记录，快去添加吧</p>
              </div>
            )}
          </div>
        </div>
        
        <div className="space-y-4">
          <div className="card p-5">
            <h3 className="font-semibold text-ink-800 mb-4 flex items-center gap-2">
              <span className="text-lg">🧧</span>
              快捷操作
            </h3>
            <div className="space-y-3">
              <button
                onClick={() => navigate('/records/add')}
                className="w-full flex items-center gap-3 p-3 bg-primary-50 hover:bg-primary-100 text-primary-600 rounded-xl transition-colors"
              >
                <div className="w-10 h-10 bg-primary-500 rounded-lg flex items-center justify-center text-white">
                  <Plus size={20} />
                </div>
                <div className="text-left">
                  <p className="font-medium">记一笔随礼</p>
                  <p className="text-xs text-primary-400">快速添加新记录</p>
                </div>
              </button>
              
              <button
                onClick={() => navigate('/contacts')}
                className="w-full flex items-center gap-3 p-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded-xl transition-colors"
              >
                <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center text-white">
                  <Users size={20} />
                </div>
                <div className="text-left">
                  <p className="font-medium">人情往来</p>
                  <p className="text-xs text-emerald-400">查看往来明细</p>
                </div>
              </button>
            </div>
          </div>
          
          <div className="card p-5 paper-texture">
            <h3 className="font-semibold text-ink-800 mb-3 flex items-center gap-2">
              <span className="text-lg">💡</span>
              温馨提示
            </h3>
            <p className="text-sm text-ink-500 leading-relaxed">
              人情往来讲究礼尚往来，记得及时记录每一笔礼金，方便日后回礼参考。
              系统会自动提示回礼金额建议哦~
            </p>
          </div>
        </div>
      </div>
      
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
