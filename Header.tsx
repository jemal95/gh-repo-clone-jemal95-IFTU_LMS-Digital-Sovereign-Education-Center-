
import React, { useState, useRef, useEffect } from 'react';
import { Sun, Moon, Search } from 'lucide-react';
import { Language } from '../types';
import { NotificationBell } from './NotificationBell';

interface HeaderProps {
  onNavClick: (view: string) => void;
  activeView: string;
  isLoggedIn: boolean;
  userRole?: 'student' | 'teacher' | 'admin' | 'content_creator' | 'teaching_assistant' | 'guest_user';
  onLogout: () => void;
  onLoginClick: () => void;
  currentLang: Language;
  onLangChange: (lang: Language) => void;
  t: (key: string) => string;
  accessibilitySettings: any;
  onAccessibilityChange: (settings: any) => void;
  isOnline: boolean;
  onSearch: (query: string) => void;
}

const Header: React.FC<HeaderProps> = ({ 
  onNavClick, activeView, isLoggedIn, userRole, onLogout, onLoginClick, currentLang, onLangChange, t, isOnline, onSearch
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      onSearch(searchQuery);
      setSearchQuery('');
    }
  };

  // Initialize dark mode from localStorage or system preference
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleDarkMode = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    if (newMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  const handleNav = (view: string) => {
    onNavClick(view);
    setIsDropdownOpen(false);
  };

  const getNavItems = () => {
    // Standard menu items from the user's image
    const standardItems = ['home', 'courses', 'news', 'mediahub', 'about', 'locator', 'guide', 'projectreport'];
    
    if (!isLoggedIn) return standardItems;
    if (userRole === 'admin') return ['admin', ...standardItems];
    if (userRole === 'teacher' || userRole === 'teaching_assistant') return ['teacher', ...standardItems];
    if (userRole === 'content_creator') return ['teacher', ...standardItems];
    if (userRole === 'guest_user') return standardItems;
    return ['home', 'courses', 'exams', 'assignments', 'studyhall', 'tutor', 'mediahub', 'performance', 'leaderboard', 'profile', 'locator', 'guide', 'projectreport'];
  };

  const navItems = getNavItems();

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-[100] bg-white border-b-8 border-black shadow-[0px_4px_0px_0px_rgba(0,0,0,1)]">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-8">
        <div className="flex justify-between items-center h-28 md:h-40">
          {/* Left Section: Logo + Navigation */}
          <div className="flex items-center gap-12">
            {/* Logo Section */}
            <div className="flex items-center gap-4 cursor-pointer group" onClick={() => handleNav('home')}>
              <div className="w-14 h-14 md:w-20 md:h-20 bg-black rounded-2xl border-4 border-black flex items-center justify-center shadow-[6px_6px_0px_0px_rgba(34,197,94,1)] group-active:translate-y-1 transition-transform">
                <span className="text-white text-3xl md:text-5xl font-black italic">I</span>
              </div>
              <div className="flex flex-col">
                <h1 className="text-3xl md:text-6xl font-black uppercase tracking-tighter italic leading-none text-black">
                  IFTU LMS
                </h1>
                <span className="text-[8px] md:text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Digital Hub</span>
              </div>
            </div>

            {/* Desktop Navigation (Moved to Left) */}
            <nav className="hidden xl:flex items-center bg-gray-50 border-8 border-black rounded-[3rem] px-8 h-20 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
              <div className="flex items-center gap-4">
                {['home', 'courses', 'news', 'mediahub', 'about', 'locator', 'guide', 'projectreport'].map((v) => (
                  <button 
                    key={v} 
                    onClick={() => handleNav(v)} 
                    className={`text-[9px] font-black uppercase tracking-[0.1em] px-3 py-2 rounded-xl transition-all ${activeView === v ? 'bg-black text-white' : 'text-gray-400 hover:text-black'}`}
                  >
                    {t(v)}
                  </button>
                ))}
              </div>
            </nav>

            {/* Search Engine Integration */}
            <form onSubmit={handleSearchSubmit} className="hidden lg:flex items-center relative group">
              <input 
                type="text" 
                placeholder="Search Portal..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-48 xl:w-64 h-14 bg-white border-4 border-black rounded-xl px-6 pr-12 font-black uppercase text-[10px] tracking-widest focus:w-80 transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] focus:shadow-[6px_6px_0px_0px_rgba(59,130,246,1)] outline-none"
              />
              <button type="submit" className="absolute right-4 text-black hover:scale-110 transition-transform">
                <Search size={20} strokeWidth={3} />
              </button>
            </form>
          </div>

          {/* Right Section Actions */}
          <div className="flex items-center gap-4 relative" ref={dropdownRef}>
            {/* Language Selector */}
            <div className="flex items-center gap-2">
              <button 
                onClick={toggleDarkMode}
                className="w-10 h-10 md:w-12 md:h-12 rounded-xl border-4 border-black flex items-center justify-center bg-white hover:bg-gray-100 transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 active:shadow-none"
                title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              >
                {isDarkMode ? <Sun size={20} className="text-yellow-500" /> : <Moon size={20} className="text-blue-600" />}
              </button>
              <div className={`w-3 h-3 rounded-full border-2 border-black ${isOnline ? 'bg-green-500' : 'bg-red-500 animate-pulse'}`} title={isOnline ? 'Online' : 'Offline'}></div>
              <div className="flex gap-1 bg-gray-100 p-1.5 rounded-xl border-4 border-black">
              {(['en', 'am', 'om'] as Language[]).map(l => (
                <button 
                  key={l} 
                  onClick={() => onLangChange(l)} 
                  className={`px-2 py-1 rounded-lg border-2 border-black text-[8px] font-black uppercase transition-colors ${currentLang === l ? 'bg-[#FFD700]' : 'bg-white hover:bg-gray-200'}`}
                >
                  {l}
                </button>
              ))}
              </div>
            </div>
            {isLoggedIn && <NotificationBell />}

            {/* Main Action Button (Login or Identity) */}
            {isLoggedIn ? (
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => handleNav(userRole === 'admin' ? 'admin' : userRole === 'teacher' ? 'teacher' : 'performance')}
                  className="hidden sm:flex h-14 px-6 bg-blue-50 text-blue-700 rounded-xl border-4 border-black font-black uppercase text-[10px] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-blue-100 transition-all items-center gap-2"
                >
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                  Portal
                </button>
                <button onClick={onLogout} className="h-14 px-6 bg-rose-50 text-rose-600 rounded-xl border-4 border-black font-black uppercase text-[10px] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-rose-100 transition-all">
                  Logout
                </button>
              </div>
            ) : (
              <button 
                onClick={onLoginClick} 
                className="h-14 px-6 bg-black text-white rounded-xl border-4 border-black font-black uppercase text-[10px] shadow-[4px_4px_0px_0px_rgba(0,208,90,1)] hover:-translate-y-0.5 transition-all"
              >
                Login
              </button>
            )}

            {/* Dropdown Menu Toggle (Right side of Login) */}
            <div className="relative">
              <button 
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className={`w-14 h-14 md:w-16 md:h-16 rounded-xl border-4 border-black flex items-center justify-center text-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all ${isDropdownOpen ? 'bg-yellow-400 translate-y-1 shadow-none' : 'bg-white hover:bg-gray-100'}`}
                aria-label="Toggle Portal Menu"
              >
                {isDropdownOpen ? '✕' : '☰'}
              </button>

              {/* Portal Dropdown Menu */}
              {isDropdownOpen && (
                <div className="absolute right-0 top-24 w-[300px] bg-white border-8 border-black rounded-[3rem] shadow-[15px_15px_0px_0px_rgba(0,0,0,1)] overflow-hidden animate-scaleIn z-[1000]">
                  <div className="p-6 bg-gray-50 text-black flex justify-between items-center border-b-8 border-black">
                    <span className="text-[10px] font-black uppercase tracking-widest">Sovereign Menu</span>
                    <span className="text-xl">🎓</span>
                  </div>
                  <div className="flex flex-col p-4 gap-2">
                    {/* Mobile Search */}
                    <form onSubmit={handleSearchSubmit} className="lg:hidden relative mb-4">
                      <input 
                        type="text" 
                        placeholder="Search..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full h-12 bg-white border-4 border-black rounded-xl px-4 pr-10 font-black uppercase text-[10px] outline-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                      />
                      <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2">
                        <Search size={16} strokeWidth={3} />
                      </button>
                    </form>

                    {navItems.map((v) => (
                      <button 
                        key={v} 
                        onClick={() => handleNav(v)} 
                        className={`w-full text-left px-8 py-5 rounded-2xl border-4 border-black font-black uppercase text-xs tracking-widest transition-all ${activeView === v ? 'bg-blue-600 text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]' : 'bg-white hover:bg-gray-50 hover:translate-x-2'}`}
                      >
                        {t(v)}
                      </button>
                    ))}
                    
                    {/* Logged in info */}
                    {isLoggedIn && (
                      <div className="mt-4 pt-4 border-t-4 border-black/10 flex items-center gap-4 px-4">
                        <div className="w-10 h-10 rounded-lg bg-gray-100 border-2 border-black flex items-center justify-center text-xl">👤</div>
                        <div className="leading-tight">
                          <p className="text-[9px] font-black uppercase text-gray-400">Authenticated Role</p>
                          <p className="text-xs font-black uppercase italic">{userRole}</p>
                        </div>
                      </div>
                    )}

                    {/* Quick Language Mobile */}
                    <div className="md:hidden mt-4 pt-4 border-t-4 border-black/10 flex gap-2">
                      {(['en', 'am', 'om'] as Language[]).map(l => (
                        <button key={l} onClick={() => onLangChange(l)} className={`flex-1 py-3 rounded-xl border-2 border-black text-[9px] font-black uppercase ${currentLang === l ? 'bg-[#FFD700]' : 'bg-white'}`}>{l}</button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
