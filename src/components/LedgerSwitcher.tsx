import { useState } from 'react';
import { useGiftStore } from '@/store/useGiftStore';
import { ChevronDown, Plus, Edit2, Trash2, X, Check } from 'lucide-react';
import { LEDGER_COLORS, LEDGER_ICONS, type Ledger } from '@/types';

interface LedgerSwitcherProps {
  variant?: 'header' | 'bottom';
}

export default function LedgerSwitcher({ variant = 'header' }: LedgerSwitcherProps) {
  const ledgers = useGiftStore(state => state.ledgers);
  const currentLedgerId = useGiftStore(state => state.currentLedgerId);
  const switchLedger = useGiftStore(state => state.switchLedger);
  const addLedger = useGiftStore(state => state.addLedger);
  const editLedger = useGiftStore(state => state.editLedger);
  const removeLedger = useGiftStore(state => state.removeLedger);
  
  const [showPanel, setShowPanel] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingLedger, setEditingLedger] = useState<Ledger | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  
  const [newName, setNewName] = useState('');
  const [newIcon, setNewIcon] = useState(LEDGER_ICONS[0]);
  const [newColor, setNewColor] = useState(LEDGER_COLORS[0]);
  
  const currentLedger = ledgers.find(l => l.id === currentLedgerId);
  
  const handleSwitch = (ledgerId: string) => {
    switchLedger(ledgerId);
    setShowPanel(false);
  };
  
  const openCreateModal = () => {
    setNewName('');
    setNewIcon(LEDGER_ICONS[0]);
    setNewColor(LEDGER_COLORS[0]);
    setShowCreateModal(true);
    setShowPanel(false);
  };
  
  const openEditModal = (ledger: Ledger) => {
    setEditingLedger(ledger);
    setNewName(ledger.name);
    setNewIcon(ledger.icon);
    setNewColor(ledger.color);
    setShowPanel(false);
  };
  
  const handleCreate = () => {
    if (!newName.trim()) return;
    addLedger(newName.trim(), newIcon, newColor);
    setShowCreateModal(false);
  };
  
  const handleEdit = () => {
    if (!editingLedger || !newName.trim()) return;
    editLedger(editingLedger.id, { name: newName.trim(), icon: newIcon, color: newColor });
    setEditingLedger(null);
  };
  
  const handleDelete = (ledgerId: string) => {
    if (ledgers.length <= 1) {
      alert('至少需要保留一个账本');
      return;
    }
    removeLedger(ledgerId);
    setDeleteConfirmId(null);
  };
  
  if (variant === 'bottom') {
    return (
      <>
        <button
          onClick={() => setShowPanel(!showPanel)}
          className="flex items-center gap-2 px-3 py-1.5 bg-white/80 hover:bg-white rounded-lg transition-colors"
        >
          <span className="text-lg">{currentLedger?.icon || '🧧'}</span>
          <span className="text-xs font-medium text-ink-600 max-w-20 truncate">
            {currentLedger?.name || '我的人情'}
          </span>
          <ChevronDown size={14} className="text-ink-400" />
        </button>
        
        {showPanel && (
          <LedgerPanel
            ledgers={ledgers}
            currentLedgerId={currentLedgerId}
            onSwitch={handleSwitch}
            onCreate={openCreateModal}
            onEdit={openEditModal}
            onDelete={(id) => setDeleteConfirmId(id)}
            onClose={() => setShowPanel(false)}
          />
        )}
        
        {(showCreateModal || editingLedger) && (
          <LedgerFormModal
            isEdit={!!editingLedger}
            name={newName}
            icon={newIcon}
            color={newColor}
            onNameChange={setNewName}
            onIconChange={setNewIcon}
            onColorChange={setNewColor}
            onSubmit={editingLedger ? handleEdit : handleCreate}
            onCancel={() => {
              setShowCreateModal(false);
              setEditingLedger(null);
            }}
          />
        )}
        
        {deleteConfirmId && (
          <DeleteConfirmModal
            ledgerName={ledgers.find(l => l.id === deleteConfirmId)?.name || ''}
            onConfirm={() => handleDelete(deleteConfirmId)}
            onCancel={() => setDeleteConfirmId(null)}
          />
        )}
      </>
    );
  }
  
  return (
    <>
      <button
        onClick={() => setShowPanel(!showPanel)}
        className="flex items-center gap-2 px-3 py-2 hover:bg-cream-100 rounded-lg transition-colors"
      >
        <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${currentLedger?.color || 'from-primary-500 to-primary-700'} flex items-center justify-center text-lg shadow-sm`}>
          {currentLedger?.icon || '🧧'}
        </div>
        <div className="text-left hidden sm:block">
          <p className="text-sm font-semibold text-ink-800 leading-tight">
            {currentLedger?.name || '我的人情'}
          </p>
          <p className="text-xs text-ink-400">点击切换账本</p>
        </div>
        <ChevronDown size={18} className={`text-ink-400 transition-transform ${showPanel ? 'rotate-180' : ''}`} />
      </button>
      
      {showPanel && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setShowPanel(false)}
          />
          <div className="absolute top-full left-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-cream-200 overflow-hidden z-50 animate-slide-up">
            <div className="p-3 border-b border-cream-100">
              <p className="text-xs text-ink-400 font-medium">选择账本</p>
            </div>
            
            <div className="max-h-64 overflow-y-auto">
              {ledgers.map((ledger) => (
                <div
                  key={ledger.id}
                  className={`flex items-center gap-3 px-4 py-3 hover:bg-cream-50 cursor-pointer transition-colors group ${
                    ledger.id === currentLedgerId ? 'bg-primary-50' : ''
                  }`}
                  onClick={() => handleSwitch(ledger.id)}
                >
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${ledger.color} flex items-center justify-center text-xl shadow-sm flex-shrink-0`}>
                    {ledger.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-ink-800 truncate">
                      {ledger.name}
                    </p>
                    {ledger.id === currentLedgerId && (
                      <p className="text-xs text-primary-500">当前账本</p>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openEditModal(ledger);
                      }}
                      className="p-1.5 text-ink-400 hover:text-primary-500 hover:bg-primary-50 rounded-lg transition-colors"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteConfirmId(ledger.id);
                      }}
                      className="p-1.5 text-ink-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="p-3 border-t border-cream-100">
              <button
                onClick={openCreateModal}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-primary-50 hover:bg-primary-100 text-primary-600 rounded-xl font-medium transition-colors"
              >
                <Plus size={18} />
                新建账本
              </button>
            </div>
          </div>
        </>
      )}
      
      {(showCreateModal || editingLedger) && (
        <LedgerFormModal
          isEdit={!!editingLedger}
          name={newName}
          icon={newIcon}
          color={newColor}
          onNameChange={setNewName}
          onIconChange={setNewIcon}
          onColorChange={setNewColor}
          onSubmit={editingLedger ? handleEdit : handleCreate}
          onCancel={() => {
            setShowCreateModal(false);
            setEditingLedger(null);
          }}
        />
      )}
      
      {deleteConfirmId && (
        <DeleteConfirmModal
          ledgerName={ledgers.find(l => l.id === deleteConfirmId)?.name || ''}
          onConfirm={() => handleDelete(deleteConfirmId)}
          onCancel={() => setDeleteConfirmId(null)}
        />
      )}
    </>
  );
}

interface LedgerPanelProps {
  ledgers: Ledger[];
  currentLedgerId: string;
  onSwitch: (id: string) => void;
  onCreate: () => void;
  onEdit: (ledger: Ledger) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}

function LedgerPanel({ ledgers, currentLedgerId, onSwitch, onCreate, onEdit, onDelete, onClose }: LedgerPanelProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-md bg-white rounded-t-3xl shadow-2xl animate-slide-up-bottom">
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 bg-ink-200 rounded-full" />
        </div>
        
        <div className="px-6 py-2">
          <p className="text-sm font-medium text-ink-400 text-center">选择账本</p>
        </div>
        
        <div className="px-4 py-3 max-h-80 overflow-y-auto">
          {ledgers.map((ledger) => (
            <div
              key={ledger.id}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl mb-2 cursor-pointer transition-all ${
                ledger.id === currentLedgerId 
                  ? 'bg-primary-50 ring-2 ring-primary-200' 
                  : 'bg-cream-50 hover:bg-cream-100'
              }`}
              onClick={() => onSwitch(ledger.id)}
            >
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${ledger.color} flex items-center justify-center text-2xl shadow-sm flex-shrink-0`}>
                {ledger.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-ink-800 truncate">
                  {ledger.name}
                </p>
                {ledger.id === currentLedgerId && (
                  <p className="text-xs text-primary-500 font-medium">当前使用中</p>
                )}
              </div>
              
              <div className="flex items-center gap-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(ledger);
                  }}
                  className="p-2 text-ink-400 hover:text-primary-500 hover:bg-white rounded-lg transition-colors"
                >
                  <Edit2 size={18} />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(ledger.id);
                  }}
                  className="p-2 text-ink-400 hover:text-red-500 hover:bg-white rounded-lg transition-colors"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
        
        <div className="p-4 pb-8">
          <button
            onClick={onCreate}
            className="w-full flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white rounded-xl font-semibold shadow-lg shadow-primary-500/30 transition-all active:scale-[0.98]"
          >
            <Plus size={20} />
            新建账本
          </button>
        </div>
      </div>
    </div>
  );
}

interface LedgerFormModalProps {
  isEdit: boolean;
  name: string;
  icon: string;
  color: string;
  onNameChange: (name: string) => void;
  onIconChange: (icon: string) => void;
  onColorChange: (color: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
}

function LedgerFormModal({
  isEdit,
  name,
  icon,
  color,
  onNameChange,
  onIconChange,
  onColorChange,
  onSubmit,
  onCancel,
}: LedgerFormModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onCancel}
      />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm animate-bounce-soft">
        <div className="p-5 border-b border-cream-100">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-ink-800">
              {isEdit ? '编辑账本' : '新建账本'}
            </h3>
            <button
              onClick={onCancel}
              className="p-1.5 hover:bg-cream-100 rounded-lg transition-colors"
            >
              <X size={20} className="text-ink-400" />
            </button>
          </div>
        </div>
        
        <div className="p-5 space-y-5">
          <div>
            <label className="block text-sm font-medium text-ink-700 mb-2">
              账本名称
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => onNameChange(e.target.value)}
              placeholder="请输入账本名称"
              className="w-full px-4 py-3 bg-cream-50 border border-cream-200 rounded-xl text-ink-800 placeholder:text-ink-300 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
              autoFocus
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-ink-700 mb-2">
              选择图标
            </label>
            <div className="flex gap-2 flex-wrap">
              {LEDGER_ICONS.map((ic) => (
                <button
                  key={ic}
                  onClick={() => onIconChange(ic)}
                  className={`w-11 h-11 rounded-xl text-2xl flex items-center justify-center transition-all ${
                    icon === ic
                      ? 'bg-primary-100 ring-2 ring-primary-400 scale-110'
                      : 'bg-cream-100 hover:bg-cream-200'
                  }`}
                >
                  {ic}
                </button>
              ))}
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-ink-700 mb-2">
              选择颜色
            </label>
            <div className="flex gap-2 flex-wrap">
              {LEDGER_COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => onColorChange(c)}
                  className={`w-11 h-11 rounded-xl bg-gradient-to-br ${c} flex items-center justify-center transition-all ${
                    color === c
                      ? 'ring-2 ring-offset-2 ring-ink-400 scale-110'
                      : 'hover:scale-105'
                  }`}
                >
                  {color === c && <Check size={18} className="text-white" />}
                </button>
              ))}
            </div>
          </div>
          
          <div className="pt-2">
            <p className="text-xs text-ink-400 mb-3">预览效果</p>
            <div className={`w-full h-16 rounded-xl bg-gradient-to-br ${color} flex items-center gap-3 px-4 shadow-md`}>
              <span className="text-3xl">{icon}</span>
              <span className="text-white font-bold text-lg">
                {name || '账本名称'}
              </span>
            </div>
          </div>
        </div>
        
        <div className="p-5 border-t border-cream-100 flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 bg-cream-100 hover:bg-cream-200 text-ink-600 rounded-xl font-medium transition-colors"
          >
            取消
          </button>
          <button
            onClick={onSubmit}
            disabled={!name.trim()}
            className="flex-1 py-2.5 bg-primary-500 hover:bg-primary-600 disabled:bg-ink-200 disabled:text-ink-400 disabled:cursor-not-allowed text-white rounded-xl font-medium transition-colors"
          >
            {isEdit ? '保存' : '创建'}
          </button>
        </div>
      </div>
    </div>
  );
}

interface DeleteConfirmModalProps {
  ledgerName: string;
  onConfirm: () => void;
  onCancel: () => void;
}

function DeleteConfirmModal({ ledgerName, onConfirm, onCancel }: DeleteConfirmModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/50"
        onClick={onCancel}
      />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm animate-bounce-soft">
        <div className="p-6">
          <h3 className="text-lg font-bold text-ink-800 mb-2">确认删除</h3>
          <p className="text-ink-500 text-sm">
            确定要删除账本「{ledgerName}」吗？
          </p>
          <p className="text-red-500 text-sm mt-2">
            ⚠️ 删除后该账本的所有记录将无法恢复！
          </p>
        </div>
        
        <div className="p-5 border-t border-cream-100 flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 bg-cream-100 hover:bg-cream-200 text-ink-600 rounded-xl font-medium transition-colors"
          >
            取消
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl font-medium transition-colors"
          >
            确认删除
          </button>
        </div>
      </div>
    </div>
  );
}
