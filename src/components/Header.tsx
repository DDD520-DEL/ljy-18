import { NavLink, useNavigate } from 'react-router-dom';
import { Home, BookOpen, Calendar, Users, BarChart3, Settings as SettingsIcon, Sun, Moon } from 'lucide-react';
import LedgerSwitcher from './LedgerSwitcher';
import { useTheme } from '@/hooks/useTheme';

const navItems = [
  { path: '/', label: '首页', icon: Home },
  { path: '/records', label: '记录', icon: BookOpen },
  { path: '/calendar', label: '日历', icon: Calendar },
  { path: '/contacts', label: '往来', icon: Users },
  { path: '/statistics', label: '统计', icon: BarChart3 },
];

export default function Header() {
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useTheme();
  
  return (
    <header className="bg-white/80 dark:bg-ink-900/80 backdrop-blur-md border-b border-cream-200 dark:border-ink-800 sticky top-0 z-50 transition-colors duration-300">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <LedgerSwitcher variant="header" />
          </div>
          
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === '/'}
                  className={({ isActive }) =>
                    `flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? 'bg-primary-50 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400'
                        : 'text-ink-500 hover:text-ink-700 hover:bg-cream-100 dark:text-ink-400 dark:hover:text-ink-200 dark:hover:bg-ink-800'
                    }`
                  }
                >
                  <Icon size={18} />
                  {item.label}
                </NavLink>
              );
            })}
            <button
              onClick={toggleTheme}
              className="ml-2 p-2 text-ink-500 hover:text-ink-700 hover:bg-cream-100 dark:text-ink-400 dark:hover:text-ink-200 dark:hover:bg-ink-800 rounded-lg transition-colors"
              title={isDark ? '切换到浅色模式' : '切换到深色模式'}
            >
              {isDark ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button
              onClick={() => navigate('/settings')}
              className="p-2 text-ink-500 hover:text-ink-700 hover:bg-cream-100 dark:text-ink-400 dark:hover:text-ink-200 dark:hover:bg-ink-800 rounded-lg transition-colors"
            >
              <SettingsIcon size={18} />
            </button>
          </nav>
          
          <div className="md:hidden flex items-center gap-1">
            <button
              onClick={toggleTheme}
              className="p-2 text-ink-500 hover:text-ink-700 hover:bg-cream-100 dark:text-ink-400 dark:hover:text-ink-200 dark:hover:bg-ink-800 rounded-lg transition-colors"
              title={isDark ? '切换到浅色模式' : '切换到深色模式'}
            >
              {isDark ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <button
              onClick={() => navigate('/settings')}
              className="p-2 text-ink-500 hover:text-ink-700 hover:bg-cream-100 dark:text-ink-400 dark:hover:text-ink-200 dark:hover:bg-ink-800 rounded-lg transition-colors"
            >
              <SettingsIcon size={20} />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
