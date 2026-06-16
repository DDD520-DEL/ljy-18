import { useState, useEffect, useRef } from 'react';
import { useGiftStore } from '@/store/useGiftStore';
import { 
  ArrowLeft, Save, Target, TrendingUp, Wallet, AlertCircle, Trash2,
  Download, Upload, Lock, Unlock, Merge, HardDrive, Check, X, Eye, EyeOff
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatMoney } from '@/utils/money';
import { BACKUP_FILE_EXTENSION, formatBackupTimestamp, type BackupFile, type ImportMode, type BackupProgress } from '@/services/backup';

type ModalType = 'export' | 'import' | 'import-mode' | null;

export default function Settings() {
  const navigate = useNavigate();
  const getYearlyBudget = useGiftStore(state => state.getYearlyBudget);
  const setYearlyBudget = useGiftStore(state => state.setYearlyBudget);
  const deleteYearlyBudget = useGiftStore(state => state.deleteYearlyBudget);
  const getBudgetProgress = useGiftStore(state => state.getBudgetProgress);
  const getAllBudgets = useGiftStore(state => state.getAllBudgets);
  const loadMockData = useGiftStore(state => state.loadMockData);
  const exportEncryptedBackup = useGiftStore(state => state.exportEncryptedBackup);
  const readBackupFile = useGiftStore(state => state.readBackupFile);
  const decryptBackup = useGiftStore(state => state.decryptBackup);
  const importBackup = useGiftStore(state => state.importBackup);
  const checkLocalDataExists = useGiftStore(state => state.checkLocalDataExists);
  const refreshRecords = useGiftStore(state => state.refreshRecords);
  
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [budgetInput, setBudgetInput] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [savedBudgets, setSavedBudgets] = useState<ReturnType<typeof getAllBudgets>>([]);
  
  const [modalType, setModalType] = useState<ModalType>(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [backupProgress, setBackupProgress] = useState<BackupProgress | null>(null);
  const [error, setError] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [decryptedBackup, setDecryptedBackup] = useState<BackupFile | null>(null);
  const [importMode, setImportMode] = useState<ImportMode>('merge');
  const [importResult, setImportResult] = useState<{ success: boolean; message: string } | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  
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
  
  const resetModalState = () => {
    setPassword('');
    setConfirmPassword('');
    setShowPassword(false);
    setShowConfirmPassword(false);
    setBackupProgress(null);
    setError('');
    setSelectedFile(null);
    setDecryptedBackup(null);
    setImportMode('merge');
    setImportResult(null);
  };
  
  const openExportModal = () => {
    resetModalState();
    setModalType('export');
  };
  
  const openImportModal = () => {
    resetModalState();
    setModalType('import');
    fileInputRef.current?.click();
  };
  
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (!file.name.endsWith(BACKUP_FILE_EXTENSION)) {
      setError(`请选择正确的备份文件 (${BACKUP_FILE_EXTENSION})`);
      return;
    }
    
    setSelectedFile(file);
    setError('');
  };
  
  const handleExport = async () => {
    if (!password) {
      setError('请输入密码');
      return;
    }
    
    if (password.length < 6) {
      setError('密码长度至少6位');
      return;
    }
    
    if (password !== confirmPassword) {
      setError('两次输入的密码不一致');
      return;
    }
    
    setError('');
    
    try {
      await exportEncryptedBackup(password, (progress) => {
        setBackupProgress(progress);
      });
      
      setTimeout(() => {
        setModalType(null);
        resetModalState();
      }, 1000);
    } catch (e) {
      setError(e instanceof Error ? e.message : '导出失败');
      setBackupProgress(null);
    }
  };
  
  const handleDecrypt = async () => {
    if (!selectedFile) {
      setError('请先选择备份文件');
      return;
    }
    
    if (!password) {
      setError('请输入密码');
      return;
    }
    
    setError('');
    
    try {
      const encryptedData = await readBackupFile(selectedFile);
      const backup = await decryptBackup(encryptedData, password, (progress) => {
        setBackupProgress(progress);
      });
      
      setDecryptedBackup(backup);
      
      const hasLocalData = checkLocalDataExists();
      if (hasLocalData) {
        setModalType('import-mode');
      } else {
        setImportMode('overwrite');
        handleImport('overwrite');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : '解密失败');
      setBackupProgress(null);
    }
  };
  
  const handleImport = (mode: ImportMode) => {
    if (!decryptedBackup) return;
    
    try {
      const result = importBackup(decryptedBackup, mode, (progress) => {
        setBackupProgress(progress);
      });
      
      setImportResult(result);
      refreshRecords();
      setSavedBudgets(getAllBudgets());
      
      setTimeout(() => {
        setModalType(null);
        resetModalState();
      }, 2000);
    } catch (e) {
      setError(e instanceof Error ? e.message : '导入失败');
      setBackupProgress(null);
    }
  };
  
  const closeModal = () => {
    if (backupProgress && backupProgress.current < backupProgress.total) {
      if (!confirm('操作正在进行中，确定要关闭吗？')) {
        return;
      }
    }
    setModalType(null);
    resetModalState();
  };
  
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
          <h2 className="text-lg font-semibold text-ink-800 mb-4 flex items-center gap-2">
            <HardDrive size={20} className="text-primary-500" />
            数据备份与迁移
          </h2>
          <p className="text-sm text-ink-400 mb-5">
            将数据加密导出为备份文件，可在其他设备上导入恢复
          </p>
          
          <div className="space-y-3">
            <button
              onClick={openExportModal}
              className="w-full py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
            >
              <Download size={18} />
              导出加密备份
            </button>
            
            <button
              onClick={openImportModal}
              className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
            >
              <Upload size={18} />
              从备份文件恢复
            </button>
            
            <input
              ref={fileInputRef}
              type="file"
              accept={BACKUP_FILE_EXTENSION}
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>
        </div>
        
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
      
      {modalType && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl animate-slide-up">
            <div className="p-6 border-b border-cream-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-ink-800">
                  {modalType === 'export' && '导出加密备份'}
                  {modalType === 'import' && '导入备份文件'}
                  {modalType === 'import-mode' && '选择导入模式'}
                </h3>
                <button
                  onClick={closeModal}
                  className="p-2 hover:bg-cream-100 rounded-lg transition-colors"
                  disabled={backupProgress && backupProgress.current < backupProgress.total}
                >
                  <X size={20} className="text-ink-400" />
                </button>
              </div>
            </div>
            
            <div className="p-6">
              {modalType === 'export' && !backupProgress && !importResult && (
                <div className="space-y-4">
                  <div className="p-4 bg-cream-50 rounded-xl">
                    <div className="flex items-start gap-3">
                      <Lock size={20} className="text-primary-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-ink-700">加密保护</p>
                        <p className="text-sm text-ink-500 mt-1">
                          备份文件将使用 AES-256 加密，请设置密码并妥善保管。
                          忘记密码将无法恢复数据。
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-ink-700 mb-2">
                      设置密码
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="请输入密码（至少6位）"
                        className="w-full px-4 py-3 pr-12 bg-cream-50 border border-cream-200 rounded-xl text-ink-800 placeholder:text-ink-300 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-600"
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-ink-700 mb-2">
                      确认密码
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="请再次输入密码"
                        className="w-full px-4 py-3 pr-12 bg-cream-50 border border-cream-200 rounded-xl text-ink-800 placeholder:text-ink-300 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-600"
                      >
                        {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>
                  
                  {error && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2">
                      <AlertCircle size={18} className="text-red-500 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-red-600">{error}</p>
                    </div>
                  )}
                  
                  <button
                    onClick={handleExport}
                    className="w-full py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-xl font-semibold transition-colors flex items-center justify-center gap-2"
                  >
                    <Download size={18} />
                    导出备份文件
                  </button>
                </div>
              )}
              
              {modalType === 'import' && !decryptedBackup && !importResult && (
                <div className="space-y-4">
                  <div className="p-4 bg-cream-50 rounded-xl">
                    <div className="flex items-start gap-3">
                      <Unlock size={20} className="text-emerald-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-ink-700">选择备份文件</p>
                        <p className="text-sm text-ink-500 mt-1">
                          选择以 {BACKUP_FILE_EXTENSION} 结尾的备份文件
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {selectedFile ? (
                    <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3">
                      <Check size={20} className="text-emerald-500" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-ink-700 truncate">{selectedFile.name}</p>
                        <p className="text-sm text-ink-500">
                          {(selectedFile.size / 1024).toFixed(2)} KB
                        </p>
                      </div>
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="text-sm text-primary-500 hover:text-primary-600"
                      >
                        更换
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full py-8 border-2 border-dashed border-cream-300 rounded-xl text-ink-400 hover:border-primary-400 hover:text-primary-500 transition-colors flex flex-col items-center gap-2"
                    >
                      <Upload size={32} />
                      <span>点击选择备份文件</span>
                    </button>
                  )}
                  
                  {selectedFile && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-ink-700 mb-2">
                          输入备份密码
                        </label>
                        <div className="relative">
                          <input
                            type={showPassword ? 'text' : 'password'}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="请输入备份密码"
                            className="w-full px-4 py-3 pr-12 bg-cream-50 border border-cream-200 rounded-xl text-ink-800 placeholder:text-ink-300 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-600"
                          >
                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                          </button>
                        </div>
                      </div>
                      
                      {error && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2">
                          <AlertCircle size={18} className="text-red-500 flex-shrink-0 mt-0.5" />
                          <p className="text-sm text-red-600">{error}</p>
                        </div>
                      )}
                      
                      <button
                        onClick={handleDecrypt}
                        disabled={!selectedFile || !password || (backupProgress && backupProgress.current < backupProgress.total)}
                        className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 disabled:bg-ink-200 disabled:text-ink-400 text-white rounded-xl font-semibold transition-colors flex items-center justify-center gap-2"
                      >
                        <Unlock size={18} />
                        解密并导入
                      </button>
                    </>
                  )}
                </div>
              )}
              
              {modalType === 'import-mode' && decryptedBackup && !importResult && (
                <div className="space-y-4">
                  <div className="p-4 bg-cream-50 rounded-xl">
                    <div className="flex items-start gap-3">
                      <HardDrive size={20} className="text-primary-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-ink-700">备份文件信息</p>
                        <div className="text-sm text-ink-500 mt-2 space-y-1">
                          <p>备份时间：{formatBackupTimestamp(decryptedBackup.timestamp)}</p>
                          <p>记录数量：{decryptedBackup.data.records.length} 条</p>
                          <p>预算设置：{decryptedBackup.data.budgets.length} 项</p>
                          <p>备份版本：v{decryptedBackup.version}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                    <div className="flex items-start gap-3">
                      <AlertCircle size={20} className="text-amber-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-ink-700">检测到本地已有数据</p>
                        <p className="text-sm text-ink-500 mt-1">
                          请选择数据导入方式
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <button
                      onClick={() => handleImport('overwrite')}
                      className={`w-full p-4 border-2 rounded-xl text-left transition-all ${
                        importMode === 'overwrite'
                          ? 'border-red-500 bg-red-50'
                          : 'border-cream-200 hover:border-red-300'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg ${importMode === 'overwrite' ? 'bg-red-100' : 'bg-cream-100'}`}>
                          <HardDrive size={20} className={importMode === 'overwrite' ? 'text-red-500' : 'text-ink-500'} />
                        </div>
                        <div className="flex-1">
                          <p className={`font-semibold ${importMode === 'overwrite' ? 'text-red-600' : 'text-ink-700'}`}>
                            覆盖模式
                          </p>
                          <p className="text-sm text-ink-500 mt-1">
                            删除本地所有数据，用备份文件的数据完全替换。
                            <span className="text-red-500 font-medium">此操作不可恢复！</span>
                          </p>
                        </div>
                      </div>
                    </button>
                    
                    <button
                      onClick={() => handleImport('merge')}
                      className={`w-full p-4 border-2 rounded-xl text-left transition-all ${
                        importMode === 'merge'
                          ? 'border-emerald-500 bg-emerald-50'
                          : 'border-cream-200 hover:border-emerald-300'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg ${importMode === 'merge' ? 'bg-emerald-100' : 'bg-cream-100'}`}>
                          <Merge size={20} className={importMode === 'merge' ? 'text-emerald-500' : 'text-ink-500'} />
                        </div>
                        <div className="flex-1">
                          <p className={`font-semibold ${importMode === 'merge' ? 'text-emerald-600' : 'text-ink-700'}`}>
                            智能合并（推荐）
                          </p>
                          <p className="text-sm text-ink-500 mt-1">
                            按记录 ID 去重合并，保留本地数据的同时新增备份中的新记录。
                          </p>
                        </div>
                      </div>
                    </button>
                  </div>
                  
                  {error && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2">
                      <AlertCircle size={18} className="text-red-500 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-red-600">{error}</p>
                    </div>
                  )}
                </div>
              )}
              
              {backupProgress && backupProgress.current < backupProgress.total && (
                <div className="py-8">
                  <div className="text-center mb-4">
                    <p className="text-ink-700 font-medium">
                      {backupProgress.phase === 'preparing' && '正在准备数据...'}
                      {backupProgress.phase === 'encrypting' && '正在加密...'}
                      {backupProgress.phase === 'decrypting' && '正在解密...'}
                      {backupProgress.phase === 'importing' && '正在导入...'}
                      {backupProgress.phase === 'downloading' && '正在下载...'}
                    </p>
                    <p className="text-sm text-ink-400 mt-1">
                      {backupProgress.current} / {backupProgress.total}
                    </p>
                  </div>
                  <div className="h-2 bg-cream-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary-500 rounded-full transition-all duration-300"
                      style={{ width: `${(backupProgress.current / backupProgress.total) * 100}%` }}
                    />
                  </div>
                </div>
              )}
              
              {importResult && (
                <div className="py-8 text-center">
                  <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${
                    importResult.success ? 'bg-emerald-100' : 'bg-red-100'
                  }`}>
                    {importResult.success ? (
                      <Check size={32} className="text-emerald-500" />
                    ) : (
                      <X size={32} className="text-red-500" />
                    )}
                  </div>
                  <p className={`font-semibold text-lg ${
                    importResult.success ? 'text-emerald-600' : 'text-red-600'
                  }`}>
                    {importResult.success ? '操作成功' : '操作失败'}
                  </p>
                  <p className="text-ink-500 mt-2">{importResult.message}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
