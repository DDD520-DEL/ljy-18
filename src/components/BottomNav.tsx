import { NavLink } from 'react-router-dom';
import { Home, BookOpen, Users, BarChart3, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const navItems = [
  { path: '/', label: '首页', icon: Home },
  { path: '/records', label: '记录', icon: BookOpen },
  { path: '/contacts', label: '往来', icon: Users },
  { path: '/statistics', label: '统计', icon: BarChart3 },
];

export default function BottomNav() {
  const navigate = useNavigate();
  
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-cream-200 z-50 pb-safe">
      <div className="flex items-center justify-around h-16 px-2">
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
                    : 'text-ink-400'
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
