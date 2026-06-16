import { useState, useEffect } from 'react';
import { useGiftStore } from '@/store/useGiftStore';
import { ArrowLeft, Save, Target, TrendingUp, Wallet, AlertCircle, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatMoney } from '@/utils/money';

export default function Settings() {
  const navigate = useNavigate();
  const getYearlyBudget = useGiftStore(state => state.getYearlyBudget);
  const setYearlyBudget = useGiftStore(state => state.setYearlyBudget);
  const deleteYearlyBudget = useGiftStore(state => state.deleteYearlyBudget);
  const getBudgetProgress = useGiftStore(state => state.getBudgetProgress);
  const getAllBudgets = useGiftStore(state => state.getAllBudgets);
  const loadMockData = useGiftStore(state => state.loadMockData);
  
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [budgetInput, setBudgetInput] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [savedBudgets, setSavedBudgets] = useState<ReturnType<typeof getAllBudgets>>([]);
  
  const budgetProgress = getBudgetProgress(selectedYear);
  const existingBudget = getYearlyBudget(selectedYear);
  
  useEffect(() => {
    if (existingBudget) {
      setBudgetInput(existingBudget.budget.toString());
    } else {
      setBudgetInput('');
    }
    setSavedBudgets(getAllBudgets());
  }, [selectedYear, existingBudget, getAllBudgets]);
  
  const handleSave = () => {
    const budget = Number(budgetInput);
    if (isNaN(budget) || budget < 0) {
      alert('请输入有效的预算金额');
      return;
    }
    
    if (budget === 0) {
      deleteYearlyBudget(selectedYear);
    } else {
      setYearlyBudget(selectedYear, budget);
    }
    
    setSavedBudgets(getAllBudgets());
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 2000);
  };
  
  const handleDelete = (year: number) => {
    if (confirm(`确定要删除 ${year} 年的预算设置吗？`)) {
      deleteYearlyBudget(year);
      setSavedBudgets(getAllBudgets());
      if (year === selectedYear) {
        setBudgetInput('');
      }
    }
  };
  
  const presetAmounts = [5000, 10000, 20000, 30000, 50000];
  
  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-white rounded-lg transition-colors"
        >
          <ArrowLeft size={20} className="text-ink-600" />
        </button>
        <h1 className="text-2xl font-serif font-bold text-ink-800">
          设置
        </h1>
      </div>
      
      {showSuccess && (
        <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-sm flex items-center gap-2 animate-slide-up">
          <Save size={16} />
          预算设置已保存
        </div>
      )}
      
      <div className="space-y-6">
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-ink-800 mb-4 flex items-center gap-2">
            <Target size={20} className="text-primary-500" />
            年度预算设置
          </h2>
          <p className="text-sm text-ink-400 mb-5">
            设定每年的人情支出预算上限，系统会帮您追踪使用进度
          </p>
          
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-ink-700 mb-2">
                选择年份
              </label>
              <div className="flex gap-2 flex-wrap">
                {[currentYear - 1, currentYear, currentYear + 1].map((year) => (
                  <button
                    key={year}
                    type="button"
                    onClick={() => setSelectedYear(year)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                      selectedYear === year
                        ? 'bg-primary-500 text-white shadow-md'
                        : 'bg-cream-100 text-ink-600 hover:bg-cream-200'
                    }`}
                  >
                    {year}年
                  </button>
                ))}
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-ink-700 mb-2">
                年度预算金额 (元)
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-400 text-xl">
                  ¥
                </span>
                <input
                  type="number"
                  value={budgetInput}
                  onChange={(e) => setBudgetInput(e.target.value)}
                  placeholder="请输入年度预算金额，设为0表示不设置"
                  min="0"
                  step="1000"
                  className="w-full pl-10 pr-4 py-4 bg-cream-50 border border-cream-200 rounded-xl text-2xl font-bold text-ink-800 placeholder:text-ink-300 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all tabular-nums"
                />
              </div>
              <div className="flex gap-2 mt-2 flex-wrap">
                {presetAmounts.map((amount) => (
                  <button
                    key={amount}
                    type="button"
                    onClick={() => setBudgetInput(amount.toString())}
                    className="px-3 py-1 text-sm bg-cream-100 hover:bg-cream-200 text-ink-600 rounded-lg transition-colors"
                  >
                    {amount >= 10000 ? `${amount / 10000}万` : amount}
                  </button>
                ))}
              </div>
            </div>
            
            {existingBudget && (
              <div className="p-4 bg-cream-50 rounded-xl">
                <p className="text-sm text-ink-500 mb-1">当前设置</p>
                <p className="text-xl font-bold text-ink-800 tabular-nums">
                  {formatMoney(existingBudget.budget)} / 年
                </p>
                <p className="text-sm text-ink-400 mt-1">
                  约 {formatMoney(Math.round(existingBudget.budget / 12))} / 月
                </p>
              </div>
            )}
            
            <button
              onClick={handleSave}
              className="w-full py-3.5 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white rounded-xl font-semibold shadow-lg shadow-primary-500/30 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
            >
              <Save size={20} />
              保存预算设置
            </button>
          </div>
        </div>
        
        {budgetProgress.budget > 0 && (
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-ink-800 mb-4 flex items-center gap-2">
              <TrendingUp size={20} className="text-primary-500" />
              {selectedYear}年预算使用情况
            </h2>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-ink-500">年度预算</span>
                <span className="font-bold text-ink-800 tabular-nums">{formatMoney(budgetProgress.budget)}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-ink-500">已使用</span>
                <span className={`font-bold tabular-nums ${budgetProgress.isOverBudget ? 'text-red-500' : 'text-primary-500'}`}>
                  {formatMoney(budgetProgress.used)}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-ink-500">剩余额度</span>
                <span className={`font-bold tabular-nums ${budgetProgress.remaining <= 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                  {formatMoney(budgetProgress.remaining)}
                </span>
              </div>
              
              <div>
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-ink-500">使用进度</span>
                  <span className={`font-medium ${budgetProgress.percentage >= 100 ? 'text-red-500' : 'text-ink-700'}`}>
                    {budgetProgress.percentage.toFixed(1)}%
                  </span>
                </div>
                <div className="h-3 bg-cream-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      budgetProgress.percentage >= 100
                        ? 'bg-gradient-to-r from-red-400 to-red-500'
                        : budgetProgress.percentage >= 80
                        ? 'bg-gradient-to-r from-gold-400 to-gold-500'
                        : 'bg-gradient-to-r from-primary-400 to-primary-500'
                    }`}
                    style={{ width: `${Math.min(budgetProgress.percentage, 100)}%` }}
                  />
                </div>
              </div>
              
              {budgetProgress.isOverBudget && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2">
                  <AlertCircle size={18} className="text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-600">
                    本年度支出已超过预算 {formatMoney(budgetProgress.used - budgetProgress.budget)}，请注意控制支出~
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
        
        {savedBudgets.length > 0 && (
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-ink-800 mb-4 flex items-center gap-2">
              <Wallet size={20} className="text-primary-500" />
              已设置的预算
            </h2>
            <div className="space-y-2">
              {savedBudgets.sort((a, b) => b.year - a.year).map((budget) => {
                const progress = getBudgetProgress(budget.year);
                return (
                  <div
                    key={budget.year}
                    className="flex items-center justify-between p-3 bg-cream-50 rounded-xl"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-ink-800">{budget.year}年</p>
                      <p className="text-sm text-ink-400 tabular-nums">
                        {formatMoney(progress.used)} / {formatMoney(budget.budget)}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-24 h-2 bg-cream-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            progress.percentage >= 100
                              ? 'bg-red-500'
                              : progress.percentage >= 80
                              ? 'bg-gold-500'
                              : 'bg-primary-500'
                          }`}
                          style={{ width: `${Math.min(progress.percentage, 100)}%` }}
                        />
                      </div>
                      <button
                        onClick={() => handleDelete(budget.year)}
                        className="p-1.5 text-ink-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-ink-800 mb-4">数据管理</h2>
          <button
            onClick={() => {
              if (confirm('确定要加载示例数据吗？这将清除现有数据。')) {
                loadMockData();
                alert('示例数据已加载');
              }
            }}
            className="w-full py-3 bg-cream-100 hover:bg-cream-200 text-ink-700 rounded-xl font-medium transition-colors"
          >
            加载示例数据
          </button>
        </div>
      </div>
      
      <div className="h-20 md:hidden" />
    </div>
  );
}
