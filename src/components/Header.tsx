import { NavLink } from 'react-router-dom';
import { Home, BookOpen, Users, BarChart3 } from 'lucide-react';

const navItems = [
  { path: '/', label: '首页', icon: Home },
  { path: '/records', label: '记录', icon: BookOpen },
  { path: '/contacts', label: '往来', icon: Users },
  { path: '/statistics', label: '统计', icon: BarChart3 },
];

export default function Header() {
  return (
    <header className="bg-white/80 backdrop-blur-md border-b border-cream-200 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-lg">
              <span className="text-xl">🧧</span>
            </div>
            <h1 className="text-xl font-serif font-bold text-ink-800">
              人情账本
            </h1>
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
                        ? 'bg-primary-50 text-primary-600'
                        : 'text-ink-500 hover:text-ink-700 hover:bg-cream-100'
                    }`
                  }
                >
                  <Icon size={18} />
                  {item.label}
                </NavLink>
              );
            })}
          </nav>
          
          <div className="w-10 h-10" />
        </div>
      </div>
    </header>
  );
}
