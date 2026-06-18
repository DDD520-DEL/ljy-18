import { NavLink } from 'react-router-dom';
import { Home, BookOpen, Users, BarChart3, Plus, Calendar, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import LedgerSwitcher from './LedgerSwitcher';
import { useGiftStore } from '@/store/useGiftStore';

const navItems = [
  { path: '/', label: '首页', icon: Home },
  { path: '/records', label: '记录', icon: BookOpen },
  { path: '/calendar', label: '日历', icon: Calendar },
  { path: '/contacts', label: '往来', icon: Users },
  { path: '/statistics', label: '统计', icon: BarChart3 },
];

export default function BottomNav() {
  const navigate = useNavigate();
  const recycleBinCount = useGiftStore(state => state.recycleBinCount);
  
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-ink-900/95 backdrop-blur-md border-t border-cream-200 dark:border-ink-800 z-50 pb-safe transition-colors duration-300">
      <div className="flex items-center justify-between px-2 py-1 border-b border-cream-100 dark:border-ink-800">
        <LedgerSwitcher variant="bottom" />
        <div className="flex items-center gap-1">
          <button
            onClick={() => navigate('/recycle-bin')}
            className="relative px-3 py-1.5 text-ink-400 dark:text-ink-500 hover:text-ink-600 dark:hover:text-ink-300 transition-colors flex items-center gap-1"
          >
            <Trash2 size={14} />
            <span className="text-xs font-medium">回收站</span>
            {recycleBinCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-[16px] px-1 rounded-full bg-red-500 text-white text-[10px] font-medium flex items-center justify-center">
                {recycleBinCount > 99 ? '99+' : recycleBinCount}
              </span>
            )}
          </button>
          <button
            onClick={() => navigate('/settings')}
            className="px-3 py-1.5 text-ink-400 dark:text-ink-500 hover:text-ink-600 dark:hover:text-ink-300 transition-colors"
          >
            <span className="text-xs font-medium">设置</span>
          </button>
        </div>
      </div>
      <div className="flex items-center justify-around h-14 px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center flex-1 py-1 transition-all duration-200 ${
                  isActive
                    ? 'text-primary-500'
                    : 'text-ink-400 dark:text-ink-500'
                }`
              }
            >
              <Icon size={22} strokeWidth={1.8} />
              <span className="text-xs mt-0.5 font-medium">{item.label}</span>
            </NavLink>
          );
        })}
      </div>
      
      <button
        onClick={() => navigate('/records/add')}
        className="absolute -top-5 left-1/2 -translate-x-1/2 w-14 h-14 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 text-white shadow-lg shadow-primary-500/30 flex items-center justify-center transition-transform active:scale-95"
      >
        <Plus size={28} strokeWidth={2.5} />
      </button>
    </nav>
  );
}
