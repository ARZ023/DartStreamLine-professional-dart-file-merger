
import React from 'react';
import { Logo } from './Logo';

interface HeaderProps {
  onReset: () => void;
  isDark: boolean;
  onToggleTheme: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onReset, isDark, onToggleTheme }) => {
  return (
    <header className="sticky top-0 z-50 w-full px-6 py-4">
      <div className="max-w-7xl mx-auto glass rounded-2xl flex justify-between items-center px-6 py-3 shadow-2xl shadow-black/10 dark:shadow-black/50">
        <div className="flex items-center gap-4 group cursor-pointer">
          <div className="relative">
            <div className="absolute inset-0 bg-violet-500 blur-xl opacity-20 group-hover:opacity-40 transition-opacity"></div>
            <Logo size={36} className="text-violet-600 dark:text-violet-400 relative z-10" />
          </div>
          <div>
            <h1 className="text-lg font-extrabold tracking-tight text-gray-900 dark:text-white leading-none">
              DART<span className="text-violet-600 dark:text-violet-400">STREAMLINE</span>
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
              <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase font-bold tracking-widest">v2025.12.29</p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-6">
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-500 dark:text-gray-400">
            <a href="#" className="hover:text-violet-600 dark:hover:text-white transition-colors">Documentation</a>
            <a href="#" className="hover:text-violet-600 dark:hover:text-white transition-colors">API</a>
          </nav>
          
          <div className="w-px h-4 bg-gray-200 dark:bg-white/10 hidden md:block"></div>

          <button 
            onClick={onToggleTheme}
            className="p-2 rounded-xl bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 transition-colors text-gray-600 dark:text-gray-300"
            aria-label="Toggle Theme"
          >
            {isDark ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 9h-1m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            )}
          </button>

          <button 
            onClick={onReset}
            className="text-xs font-bold text-gray-400 hover:text-red-500 transition-colors uppercase tracking-widest"
          >
            Clear All
          </button>
          <a 
            href="https://github.com/ARZ023/DartStreamLine-professional-dart-file-merger" 
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 text-xs font-bold bg-violet-600 text-white dark:bg-white dark:text-black rounded-lg hover:bg-violet-700 dark:hover:bg-violet-400 dark:hover:text-white transition-all flex items-center gap-2 shadow-lg shadow-violet-500/20"
          >
            GitHub
          </a>
        </div>
      </div>
    </header>
  );
};
