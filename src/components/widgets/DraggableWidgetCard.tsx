import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, X } from 'lucide-react';
import WidgetRenderer from './WidgetRenderer';
import type { WidgetConfig } from '@/types';

interface DraggableWidgetCardProps {
  widget: WidgetConfig;
  onRemove: (id: string) => void;
  isDragging?: boolean;
}

export default function DraggableWidgetCard({ widget, onRemove, isDragging }: DraggableWidgetCardProps) {
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

  const sizeClass = {
    small: 'min-h-[180px]',
    medium: 'min-h-[240px]',
    large: 'min-h-[280px]',
  }[widget.size];

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`card p-4 group relative ${sizeClass} ${
        isDragging ? 'shadow-xl ring-2 ring-primary-500' : ''
      }`}
    >
      <div className="absolute top-3 right-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
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
      </div>

      <div className="h-[calc(100%-2.5rem)]">
        <WidgetRenderer type={widget.type} size={widget.size} />
      </div>
    </div>
  );
}
