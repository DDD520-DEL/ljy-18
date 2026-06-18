import { useState } from 'react';
import { X, Plus, Check } from 'lucide-react';
import { WIDGET_DEFINITIONS, type WidgetType, type WidgetConfig } from '@/types';

interface WidgetSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentWidgets: WidgetConfig[];
  onAddWidgets: (widgets: WidgetConfig[]) => void;
}

export default function WidgetSelectorModal({ 
  isOpen, 
  onClose, 
  currentWidgets, 
  onAddWidgets 
}: WidgetSelectorModalProps) {
  const [selectedTypes, setSelectedTypes] = useState<WidgetType[]>([]);

  if (!isOpen) return null;

  const existingTypes = new Set(currentWidgets.map(w => w.type));
  
  const availableWidgets = Object.values(WIDGET_DEFINITIONS).filter(
    def => !existingTypes.has(def.type)
  );

  const handleToggle = (type: WidgetType) => {
    setSelectedTypes(prev => 
      prev.includes(type) 
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  const handleConfirm = () => {
    const newWidgets: WidgetConfig[] = selectedTypes.map((type, index) => {
      const def = WIDGET_DEFINITIONS[type];
      const maxSortOrder = Math.max(...currentWidgets.map(w => w.sortOrder), -1);
      return {
        id: `widget-${Date.now()}-${index}`,
        type,
        title: def.title,
        icon: def.icon,
        visible: true,
        sortOrder: maxSortOrder + index + 1,
        size: def.defaultSize,
      };
    });
    onAddWidgets(newWidgets);
    setSelectedTypes([]);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-ink-800 rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between p-5 border-b border-ink-100 dark:border-ink-700">
          <h2 className="text-lg font-semibold text-ink-800 dark:text-ink-200">
            添加小部件
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-ink-100 dark:hover:bg-ink-700 rounded-xl transition-colors text-ink-500 dark:text-ink-400"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {availableWidgets.length > 0 ? (
            <div className="space-y-3">
              {availableWidgets.map(def => {
                const isSelected = selectedTypes.includes(def.type);
                return (
                  <div
                    key={def.type}
                    onClick={() => handleToggle(def.type)}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      isSelected
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                        : 'border-ink-100 dark:border-ink-700 hover:border-primary-300 dark:hover:border-primary-700 hover:bg-cream-50 dark:hover:bg-ink-700/50'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        isSelected 
                          ? 'bg-primary-500 text-white' 
                          : 'bg-cream-100 dark:bg-ink-700 text-ink-600 dark:text-ink-400'
                      }`}>
                        {isSelected ? <Check size={24} /> : <span className="text-2xl">{def.icon}</span>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-ink-800 dark:text-ink-200 mb-1">
                          {def.title}
                        </h3>
                        <p className="text-sm text-ink-500 dark:text-ink-400">
                          {def.description}
                        </p>
                        <div className="mt-2">
                          <span className="text-xs px-2 py-0.5 bg-ink-100 dark:bg-ink-700 text-ink-500 dark:text-ink-400 rounded-full">
                            {def.defaultSize === 'small' ? '小尺寸' : def.defaultSize === 'medium' ? '中尺寸' : '大尺寸'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-ink-400 dark:text-ink-500">
              <p className="text-5xl mb-3">✨</p>
              <p className="font-medium">所有小部件都已添加</p>
              <p className="text-sm mt-1">可以在首页拖拽调整排序</p>
            </div>
          )}
        </div>

        <div className="p-5 border-t border-ink-100 dark:border-ink-700">
          <div className="flex items-center justify-between gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 px-4 text-ink-600 dark:text-ink-400 hover:bg-ink-100 dark:hover:bg-ink-700 rounded-xl font-medium transition-colors"
            >
              取消
            </button>
            <button
              onClick={handleConfirm}
              disabled={selectedTypes.length === 0}
              className="flex-1 py-2.5 px-4 bg-primary-500 hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-medium transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary-500/20"
            >
              <Plus size={18} />
              添加 {selectedTypes.length > 0 ? `(${selectedTypes.length})` : ''}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
