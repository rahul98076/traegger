import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import useAuthStore from '@/store/authStore';
import { 
  LayoutDashboard, ShoppingBag, Users, Clock, Settings, Package, 
  UtensilsCrossed, Menu, X, LogOut, Moon, Sun, Rabbit
} from 'lucide-react';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, color: 'bg-pink-300 dark:bg-pink-500' },
  { path: '/orders', label: 'Orders', icon: ShoppingBag, color: 'bg-blue-300 dark:bg-blue-500' },
  { path: '/production', label: 'Production', icon: Clock, color: 'bg-amber-300 dark:bg-amber-500' },
  { path: '/kitchen', label: 'Kitchen', icon: UtensilsCrossed, color: 'bg-green-300 dark:bg-green-500' },
  { path: '/menu', label: 'Menu', icon: Package, color: 'bg-purple-300 dark:bg-purple-500' },
  { path: '/customers', label: 'Customers', icon: Users, color: 'bg-orange-300 dark:bg-orange-500' },
];

export default function Layout({ children }) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  
  const [isDark, setIsDark] = useState(() => {
    return localStorage.getItem('theme') === 'dark' ||
      (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });

  const user = useAuthStore(state => state.user);
  const logout = useAuthStore(state => state.logout);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navLinks = (
    <div className="flex flex-col gap-2 p-4 relative">
      <div className="absolute top-0 right-4 text-2xl animate-bounce" style={{animationDuration: '3s'}}>🥚</div>
      <div className="absolute bottom-10 left-2 text-xl opacity-80" style={{animationDuration: '4s'}}>🌷</div>
      {navItems.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          onClick={() => setIsMobileOpen(false)}
          className={({ isActive }) => 
            `flex items-center gap-3 px-4 py-3 border-2 border-black dark:border-white font-bold transition-all relative z-10 ${
              isActive 
                ? `${item.color} text-black shadow-[4px_4px_0_0_rgba(0,0,0,1)] dark:shadow-[4px_4px_0_0_rgba(0,0,0,1)] translate-y-[-2px] translate-x-[-2px]` 
                : "bg-white dark:bg-slate-800 text-black dark:text-white hover:bg-slate-50 dark:hover:bg-slate-700 hover:shadow-[2px_2px_0_0_rgba(0,0,0,1)] dark:hover:shadow-[2px_2px_0_0_rgba(0,0,0,1)]"
            }`
          }
        >
          <item.icon className="w-5 h-5 flex-shrink-0" />
          {item.label}
        </NavLink>
      ))}

      {user?.role === 'admin' && (
        <NavLink
          to="/admin"
          onClick={() => setIsMobileOpen(false)}
          className={({ isActive }) => 
            `flex items-center gap-3 px-4 py-3 border-2 border-black dark:border-white font-bold transition-all mt-4 relative z-10 ${
              isActive 
                ? "bg-slate-800 dark:bg-slate-200 text-white dark:text-black shadow-[4px_4px_0_0_rgba(0,0,0,1)] dark:shadow-[4px_4px_0_0_rgba(0,0,0,1)] translate-y-[-2px] translate-x-[-2px]" 
                : "bg-white dark:bg-slate-800 text-black dark:text-white hover:bg-slate-100 dark:hover:bg-slate-700 hover:shadow-[2px_2px_0_0_rgba(0,0,0,1)] dark:hover:shadow-[2px_2px_0_0_rgba(0,0,0,1)]"
            }`
          }
        >
          <Settings className="w-5 h-5 flex-shrink-0" />
          Admin Settings
        </NavLink>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f4efeb] dark:bg-slate-900 flex font-sans text-black dark:text-white selection:bg-pink-300 dark:selection:bg-pink-600 transition-colors duration-200">
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 w-full bg-[#f4efeb] dark:bg-slate-900 border-b-2 border-black dark:border-white z-50 px-4 py-3 flex items-center justify-between shadow-sm transition-colors duration-200">
        <div className="font-black text-xl flex items-center gap-2">
          <div className="bg-pink-300 dark:bg-pink-500 p-2 border-2 border-black dark:border-white">
            <Rabbit className="w-5 h-5 text-black" />
          </div>
          <span className="text-black dark:text-white">Penny's 🥕</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsDark(!isDark)}
            className="p-2 border-2 border-black dark:border-white bg-white dark:bg-slate-800 active:translate-y-1 active:shadow-none shadow-[2px_2px_0_0_rgba(0,0,0,1)] dark:shadow-[2px_2px_0_0_rgba(0,0,0,1)] relative z-10"
          >
            {isDark ? <Sun className="w-5 h-5 text-white" /> : <Moon className="w-5 h-5 text-black" />}
          </button>
          <button 
            onClick={() => setIsMobileOpen(!isMobileOpen)}
            className="p-2 border-2 border-black dark:border-white bg-white dark:bg-slate-800 active:translate-y-1 active:shadow-none shadow-[2px_2px_0_0_rgba(0,0,0,1)] dark:shadow-[2px_2px_0_0_rgba(0,0,0,1)] relative z-10"
          >
            {isMobileOpen ? <X className="w-5 h-5 text-black dark:text-white" /> : <Menu className="w-5 h-5 text-black dark:text-white" />}
          </button>
        </div>
      </div>

      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex w-72 flex-col border-r-2 border-black dark:border-white bg-[#fffaf5] dark:bg-slate-950 sticky top-0 h-screen overflow-y-auto transition-colors duration-200">
        <div className="p-6 border-b-2 border-black dark:border-white flex items-center gap-3 relative overflow-hidden">
          <div className="absolute right-[-10px] top-[-10px] opacity-20 text-6xl">🌸</div>
          <div className="bg-pink-300 dark:bg-pink-500 p-2.5 border-2 border-black dark:border-white shadow-[4px_4px_0_0_rgba(0,0,0,1)] dark:shadow-[4px_4px_0_0_rgba(0,0,0,1)] relative z-10">
            <Rabbit className="w-6 h-6 text-black" />
          </div>
          <div className="flex-1 relative z-10">
            <h1 className="font-black text-2xl tracking-tight leading-tight text-black dark:text-white">Penny's <span className="text-xl">🐰</span></h1>
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Bakery System</p>
          </div>
          <button
            onClick={() => setIsDark(!isDark)}
            className="p-2 border-2 border-black dark:border-white bg-white dark:bg-slate-800 hover:translate-y-[-2px] hover:translate-x-[-2px] hover:shadow-[4px_4px_0_0_rgba(0,0,0,1)] dark:hover:shadow-[4px_4px_0_0_rgba(0,0,0,1)] transition-all relative z-10"
            title="Toggle Dark Mode"
          >
            {isDark ? <Sun className="w-5 h-5 text-white" /> : <Moon className="w-5 h-5 text-black" />}
          </button>
        </div>
        <nav className="flex-1 py-4 relative">
          {navLinks}
        </nav>
        <div className="p-4 border-2 border-black dark:border-white bg-white dark:bg-slate-800 m-4 shadow-[4px_4px_0_0_rgba(0,0,0,1)] dark:shadow-[4px_4px_0_0_rgba(0,0,0,1)] relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 border-2 border-black dark:border-white bg-amber-300 dark:bg-amber-500 flex items-center justify-center font-bold text-lg text-black">
              {user?.display_name?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 truncate">
              <p className="font-bold text-sm text-black dark:text-white">{user?.display_name}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-bold capitalize">{user?.role}</p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 bg-red-200 hover:bg-red-300 dark:bg-red-500 dark:hover:bg-red-600 text-black font-bold py-2 border-2 border-black dark:border-white transition-colors shadow-[2px_2px_0_0_rgba(0,0,0,1)] dark:shadow-[2px_2px_0_0_rgba(0,0,0,1)] active:translate-y-1 active:translate-x-1 active:shadow-none"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </aside>

      {/* Sidebar - Mobile Overlay */}
      {isMobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" onClick={() => setIsMobileOpen(false)}>
          <aside 
            className="w-3/4 max-w-sm h-full flex flex-col border-r-2 border-black dark:border-white bg-[#fffaf5] dark:bg-slate-950 animate-in slide-in-from-left transition-colors duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 mt-16 border-b-2 border-black dark:border-white">
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Navigation 🌸</p>
            </div>
            <nav className="flex-1 overflow-y-auto relative">
              <div className="absolute top-4 right-4 text-3xl opacity-20">🥚</div>
              {navLinks}
            </nav>
            <div className="p-4 border-t-2 border-black dark:border-white">
              <button 
                onClick={handleLogout} 
                className="w-full px-4 py-3 flex items-center justify-center gap-3 border-2 border-black dark:border-white bg-red-300 dark:bg-red-500 text-black font-bold shadow-[4px_4px_0_0_rgba(0,0,0,1)] dark:shadow-[4px_4px_0_0_rgba(0,0,0,1)]"
              >
                <LogOut className="w-5 h-5" />
                Sign out
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col max-w-full lg:max-w-[calc(100vw-18rem)] overflow-hidden bg-transparent">
        <div className="flex-1 overflow-y-auto w-full pt-16 lg:pt-0 p-4 lg:p-8 relative">
          <div className="fixed bottom-0 right-0 p-8 text-8xl opacity-10 pointer-events-none z-0 mix-blend-multiply dark:mix-blend-screen">
            🐰
          </div>
          <div className="fixed top-20 right-20 text-6xl opacity-10 pointer-events-none z-0 mix-blend-multiply dark:mix-blend-screen rotate-12">
            🥚
          </div>
          <div className="max-w-7xl mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-500 relative z-10">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
