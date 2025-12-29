
import React from 'react';
import { DartFile } from '../types';

interface Props {
  files: DartFile[];
  onRemove: (id: string) => void;
  onReorder: (files: DartFile[]) => void;
}

const FileList: React.FC<Props> = ({ files, onRemove, onReorder }) => {
  
  const move = (index: number, direction: 'up' | 'down') => {
    const newFiles = [...files];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= files.length) return;
    
    [newFiles[index], newFiles[targetIndex]] = [newFiles[targetIndex], newFiles[index]];
    onReorder(newFiles);
  };

  return (
    <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar p-1">
      {files.map((file, idx) => (
        <div 
          key={file.id} 
          className="flex items-center justify-between p-4 glass rounded-2xl border border-gray-200 dark:border-white/5 hover:border-violet-500/50 transition-all group relative overflow-hidden"
        >
          {/* Subtle background glow on hover */}
          <div className="absolute inset-0 bg-violet-600/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>

          <div className="flex items-center gap-4 min-w-0 relative z-10">
            <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-white/5 flex items-center justify-center text-[10px] font-black text-violet-600 dark:text-violet-400/60 border border-gray-200 dark:border-white/5">
              {idx + 1}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-bold text-gray-900 dark:text-gray-200 truncate">{file.name}</span>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[10px] text-gray-400 dark:text-gray-500 font-mono uppercase tracking-widest">{(file.size / 1024).toFixed(1)} KB</span>
                <span className="w-1 h-1 bg-gray-300 dark:bg-gray-700 rounded-full"></span>
                <span className="text-[10px] text-violet-600 dark:text-violet-500/80 font-bold uppercase tracking-widest">Dart Source</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2 relative z-10">
            <div className="flex p-1 bg-gray-100 dark:bg-white/5 rounded-lg border border-gray-200 dark:border-white/5 opacity-0 group-hover:opacity-100 transition-all scale-95 group-hover:scale-100">
              <button 
                onClick={() => move(idx, 'up')}
                disabled={idx === 0}
                className="p-1.5 hover:bg-white dark:hover:bg-white/10 rounded-md disabled:opacity-20 transition-colors"
              >
                <svg className="w-4 h-4 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                </svg>
              </button>
              <button 
                onClick={() => move(idx, 'down')}
                disabled={idx === files.length - 1}
                className="p-1.5 hover:bg-white dark:hover:bg-white/10 rounded-md disabled:opacity-20 transition-colors"
              >
                <svg className="w-4 h-4 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>
            <button 
              onClick={() => onRemove(file.id)}
              className="p-2.5 hover:bg-red-500/10 text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 rounded-xl transition-all"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default FileList;
