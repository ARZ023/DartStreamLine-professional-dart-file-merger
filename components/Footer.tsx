
import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full px-6 py-12 mt-20 border-t border-gray-200 dark:border-white/5 transition-colors">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-10">
        <div className="text-center md:text-left space-y-2">
          <p className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-[0.4em]">DartStreamline Assembly Tool</p>
          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Architected for Professional Workflows</p>
          <p className="text-[10px] text-gray-400 dark:text-gray-600 font-medium mt-4">&copy; 2025 Streamline Collective. All rights reserved.</p>
        </div>
        
        <div className="flex items-center gap-12">
          <div className="text-center md:text-right space-y-1">
            <p className="text-[9px] text-gray-400 dark:text-gray-600 uppercase tracking-[0.2em] font-black">Privacy & Trust</p>
            <p className="text-[10px] text-gray-500 dark:text-gray-400 font-bold flex items-center gap-2 justify-center md:justify-end uppercase">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
              Serverless Processing
            </p>
          </div>
          <div className="text-center md:text-right space-y-2">
            <p className="text-[9px] text-gray-400 dark:text-gray-600 uppercase tracking-[0.2em] font-black">Ecosystem</p>
            <div className="flex gap-4 justify-center md:justify-end">
              <a href="#" className="text-gray-400 hover:text-violet-600 dark:hover:text-white transition-colors">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.744.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
