import { useState, useMemo, useCallback } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { Plus, LayoutGrid } from 'lucide-react';
import { useGiftStore } from '@/store/useGiftStore';
import { DEFAULT_WIDGETS, type WidgetConfig } from '@/types';
import DraggableWidgetCard from './widgets/DraggableWidgetCard';
import WidgetSelectorModal from './widgets/WidgetSelectorModal';
import WidgetRenderer from './widgets/WidgetRenderer';

export default function Dashboard() {
  const preferences = useGiftStore(state => state.preferences);
  const updatePreferences = useGiftStore(state => state.updatePreferences);
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const widgets = useMemo(() => {
    return preferences.dashboardWidgets || DEFAULT_WIDGETS;
  }, [preferences.dashboardWidgets]);

  const visibleWidgets = useMemo(() => {
    return widgets
      .filter(w => w.visible)
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }, [widgets]);

  const activeWidget = useMemo(() => {
    return visibleWidgets.find(w => w.id === activeId) || null;
  }, [activeId, visibleWidgets]);

  const saveWidgets = useCallback((newWidgets: WidgetConfig[]) => {
    updatePreferences({
      dashboardWidgets: newWidgets,
    });
  }, [updatePreferences]);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (over && active.id !== over.id) {
      const oldIndex = visibleWidgets.findIndex(w => w.id === active.id);
      const newIndex = visibleWidgets.findIndex(w => w.id === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        const reordered = arrayMove(visibleWidgets, oldIndex, newIndex);
        const updatedWidgets = widgets.map(w => {
          const newPosition = reordered.findIndex(r => r.id === w.id);
          if (newPosition !== -1) {
            return { ...w, sortOrder: newPosition };
          }
          return w;
        });
        saveWidgets(updatedWidgets);
      }
    }
  };

  const handleRemoveWidget = useCallback((id: string) => {
    if (confirm('确定要移除这个小部件吗？')) {
      const updatedWidgets = widgets.filter(w => w.id !== id);
      saveWidgets(updatedWidgets);
    }
  }, [widgets, saveWidgets]);

  const handleAddWidgets = useCallback((newWidgets: WidgetConfig[]) => {
    const updatedWidgets = [...widgets, ...newWidgets];
    saveWidgets(updatedWidgets);
  }, [widgets, saveWidgets]);

  const getSizeGridClass = (size: 'small' | 'medium' | 'large') => {
    switch (size) {
      case 'small':
        return 'md:col-span-1';
      case 'medium':
        return 'md:col-span-1 lg:col-span-1 xl:col-span-1';
      case 'large':
        return 'md:col-span-2 lg:col-span-2 xl:col-span-2';
      default:
        return 'md:col-span-1';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center shadow-md">
            <LayoutGrid size={20} className="text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-ink-800 dark:text-ink-200">
              数据看板
            </h2>
            <p className="text-xs text-ink-400 dark:text-ink-500">
              拖拽排序，自定义您的首页
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsSelectorOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary-50 hover:bg-primary-100 dark:bg-primary-900/20 dark:hover:bg-primary-900/30 text-primary-600 dark:text-primary-400 rounded-xl font-medium transition-all active:scale-95"
          >
            <Plus size={18} />
            <span className="hidden sm:inline">添加小部件</span>
            <span className="sm:hidden">添加</span>
          </button>
        </div>
      </div>

      {visibleWidgets.length > 0 ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={visibleWidgets.map(w => w.id)} strategy={rectSortingStrategy}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4">
              {visibleWidgets.map(widget => (
                <div key={widget.id} className={getSizeGridClass(widget.size)}>
                  <DraggableWidgetCard
                    widget={widget}
                    onRemove={handleRemoveWidget}
                    isDragging={activeId === widget.id}
                  />
                </div>
              ))}
            </div>
          </SortableContext>

          <DragOverlay>
            {activeWidget ? (
              <div className="card p-4 opacity-90 shadow-2xl ring-2 ring-primary-500 rotate-1">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-lg">{activeWidget.icon}</span>
                  <h3 className="font-semibold text-ink-800 dark:text-ink-200 text-sm">
                    {activeWidget.title}
                  </h3>
                </div>
                <div className="h-48 opacity-70">
                  <WidgetRenderer type={activeWidget.type} size={activeWidget.size} />
                </div>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      ) : (
        <div className="card p-8 text-center">
          <div className="w-16 h-16 bg-primary-50 dark:bg-primary-900/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <LayoutGrid size={32} className="text-primary-500" />
          </div>
          <h3 className="text-lg font-semibold text-ink-800 dark:text-ink-200 mb-2">
            还没有小部件
          </h3>
          <p className="text-sm text-ink-500 dark:text-ink-400 mb-6">
            添加小部件来快速查看您的人情往来数据
          </p>
          <button
            onClick={() => setIsSelectorOpen(true)}
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-xl font-medium transition-all shadow-lg shadow-primary-500/20 active:scale-95"
          >
            <Plus size={20} />
            添加小部件
          </button>
        </div>
      )}

      <WidgetSelectorModal
        isOpen={isSelectorOpen}
        onClose={() => setIsSelectorOpen(false)}
        currentWidgets={widgets}
        onAddWidgets={handleAddWidgets}
      />
    </div>
  );
}
