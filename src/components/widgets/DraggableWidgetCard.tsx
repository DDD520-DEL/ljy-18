import { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, X, Maximize2, Minimize2, Square, Check } from 'lucide-react';
import WidgetRenderer from './WidgetRenderer';
import type { WidgetConfig } from '@/types';

interface DraggableWidgetCardProps {
  widget: WidgetConfig;
  onRemove: (id: string) => void;
  onResize: (id: string, size: 'small' | 'medium' | 'large') => void;
  isDragging?: boolean;
}

const SIZE_OPTIONS: Array<{ size: 'small' | 'medium' | 'large'; label: string; icon: typeof Minimize2 }> = [
  { size: 'small', label: '小', icon: Minimize2 },
  { size: 'medium', label: '中', icon: Square },
  { size: 'large', label: '大', icon: Maximize2 },
];

export default function DraggableWidgetCard({ widget, onRemove, onResize, isDragging }: DraggableWidgetCardProps) {
  const [showSizeMenu, setShowSizeMenu] = useState(false);
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: widget.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isSortableDragging ? 0.5 : 1,
    zIndex: isSortableDragging ? 50 : 'auto',
  };

  const sizeHeightClass = {
    small: 'min-h-[200px]',
    medium: 'min-h-[280px]',
    large: 'min-h-[360px]',
  }[widget.size];

  const currentSizeIndex = SIZE_OPTIONS.findIndex(s => s.size === widget.size);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`card p-4 group relative ${sizeHeightClass} ${
        isDragging ? 'shadow-xl ring-2 ring-primary-500' : ''
      }`}
    >
      <div className="absolute top-3 right-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-20">
        <div className="relative">
          <button
            onClick={() => setShowSizeMenu(!showSizeMenu)}
            className="p-1.5 hover:bg-cream-50 dark:hover:bg-ink-700 text-ink-400 hover:text-ink-600 dark:hover:text-ink-300 rounded-lg transition-colors"
            title="调整尺寸"
          >
            {currentSizeIndex === 0 && <Minimize2 size={14} />}
            {currentSizeIndex === 1 && <Square size={14} />}
            {currentSizeIndex === 2 && <Maximize2 size={14} />}
          </button>

          {showSizeMenu && (
            <>
              <div 
                className="fixed inset-0 z-30" 
                onClick={() => setShowSizeMenu(false)}
              />
              <div className="absolute right-0 top-full mt-1 bg-white dark:bg-ink-800 border border-ink-100 dark:border-ink-700 rounded-xl shadow-xl py-1 z-40 min-w-[120px]">
                {SIZE_OPTIONS.map(({ size, label, icon: Icon }) => (
                  <button
                    key={size}
                    onClick={() => {
                      onResize(widget.id, size);
                      setShowSizeMenu(false);
                    }}
                    className={`w-full px-3 py-2 flex items-center gap-2 text-sm transition-colors ${
                      widget.size === size
                        ? 'text-primary-500 bg-primary-50 dark:bg-primary-900/20 font-medium'
                        : 'text-ink-600 dark:text-ink-400 hover:bg-cream-50 dark:hover:bg-ink-700'
                    }`}
                  >
                    <Icon size={14} />
                    <span>{label}尺寸</span>
                    {widget.size === size && <Check size={14} className="ml-auto" />}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        <button
          onClick={() => onRemove(widget.id)}
          className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 text-ink-400 hover:text-red-500 rounded-lg transition-colors"
          title="移除小部件"
        >
          <X size={14} />
        </button>
        <div
          {...attributes}
          {...listeners}
          className="p-1.5 hover:bg-cream-50 dark:hover:bg-ink-700 text-ink-400 hover:text-ink-600 dark:hover:text-ink-300 rounded-lg cursor-grab active:cursor-grabbing transition-colors"
          title="拖拽排序"
        >
          <GripVertical size={14} />
        </div>
      </div>

      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg">{widget.icon}</span>
        <h3 className="font-semibold text-ink-800 dark:text-ink-200 text-sm">
          {widget.title}
        </h3>
        <span className="text-[10px] px-1.5 py-0.5 bg-ink-100 dark:bg-ink-700 text-ink-500 dark:text-ink-400 rounded-md">
          {widget.size === 'small' ? '小' : widget.size === 'medium' ? '中' : '大'}
        </span>
      </div>

      <div className="h-[calc(100%-3rem)]">
        <WidgetRenderer type={widget.type} size={widget.size} />
      </div>
    </div>
  );
}
