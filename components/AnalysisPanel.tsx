
import React from 'react';
import { AnalysisResult, MergeMode } from '../types';

interface Props {
  analysis: AnalysisResult;
  mergeMode: MergeMode;
  onSetMergeMode: (mode: MergeMode) => void;
  onMerge: () => void;
}

const AnalysisPanel: React.FC<Props> = ({ analysis, mergeMode, onSetMergeMode, onMerge }) => {
  const hasErrors = analysis.conflicts.some(c => c.severity === 'error');

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="glass rounded-3xl border border-gray-200 dark:border-white/10 overflow-hidden shadow-2xl shadow-black/5 dark:shadow-black/50">
        <div className="bg-gray-50/50 dark:bg-white/5 border-b border-gray-200 dark:border-white/5 px-8 py-6 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Analysis Hub</h2>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 uppercase tracking-tighter">Real-time code structure telemetry</p>
          </div>
          <div className="flex gap-4">
            <div className="flex items-center gap-3 bg-white/50 dark:bg-white/5 px-4 py-2 rounded-2xl border border-gray-200 dark:border-white/5">
              <span className="w-2 h-2 bg-violet-500 rounded-full shadow-[0_0_10px_rgba(139,92,246,0.6)]"></span>
              <span className="text-xs font-black text-gray-700 dark:text-gray-300 uppercase tracking-widest">{analysis.imports.length} Unified</span>
            </div>
          </div>
        </div>

        <div className="p-8 space-y-10">
          {/* Visual Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="p-6 rounded-2xl bg-gradient-to-br from-violet-600/10 to-transparent dark:from-violet-600/20 border border-violet-500/10 dark:border-violet-500/20 relative group">
              <div className="absolute top-4 right-4 text-violet-500/20 group-hover:text-violet-500 transition-colors">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
              </div>
              <span className="text-4xl font-extrabold text-gray-900 dark:text-white">{analysis.imports.length}</span>
              <p className="text-[10px] text-violet-600 dark:text-violet-400 mt-2 font-black uppercase tracking-[0.2em]">Optimized Imports</p>
            </div>
            <div className="p-6 rounded-2xl bg-gradient-to-br from-cyan-600/10 to-transparent dark:from-cyan-600/20 border border-cyan-500/10 dark:border-cyan-500/20 relative group">
              <div className="absolute top-4 right-4 text-cyan-500/20 group-hover:text-cyan-500 transition-colors">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
              </div>
              <span className="text-4xl font-extrabold text-gray-900 dark:text-white">{analysis.declarations.length}</span>
              <p className="text-[10px] text-cyan-600 dark:text-cyan-400 mt-2 font-black uppercase tracking-[0.2em]">Identified Symbols</p>
            </div>
          </div>

          {/* Conflict Section */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest flex items-center gap-2">
                System Diagnostics
              </h3>
            </div>
            
            {analysis.conflicts.length > 0 ? (
              <div className="space-y-3">
                {analysis.conflicts.map((conflict, i) => (
                  <div 
                    key={i} 
                    className={`p-5 rounded-2xl border transition-all hover:translate-x-1 ${conflict.severity === 'error' ? 'bg-red-500/5 border-red-500/20' : 'bg-orange-500/5 border-orange-500/20'}`}
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${conflict.severity === 'error' ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)]' : 'bg-orange-500'}`}></div>
                        <span className="text-sm font-bold text-gray-900 dark:text-white">{conflict.name}</span>
                        <span className="text-[10px] text-gray-500 font-mono">({conflict.type})</span>
                      </div>
                      <span className={`text-[10px] font-black px-2 py-1 rounded-lg uppercase tracking-widest ${conflict.severity === 'error' ? 'bg-red-500/20 text-red-500 dark:text-red-400' : 'bg-orange-500/20 text-orange-500 dark:text-orange-400'}`}>
                        {conflict.severity}
                      </span>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <span className="text-[10px] text-gray-400 dark:text-gray-500 uppercase font-bold mr-2">Detected In:</span>
                      {conflict.sources.map((src, j) => (
                        <span key={j} className="text-[10px] bg-gray-100 dark:bg-white/5 px-2.5 py-1 rounded-full border border-gray-200 dark:border-white/5 text-gray-600 dark:text-gray-300 font-medium">{src}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-10 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-3xl flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h4 className="font-bold text-gray-900 dark:text-white">System Integrity: Nominal</h4>
                <p className="text-sm text-gray-500 mt-2">Zero structural collisions detected in current file stack.</p>
              </div>
            )}
          </div>

          {/* Action Hub */}
          <div className="pt-10 border-t border-gray-200 dark:border-white/5">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-8">
              <div className="space-y-2">
                <span className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Merge Strategy</span>
                <div className="flex p-1.5 bg-gray-100 dark:bg-[#09090b] rounded-2xl border border-gray-200 dark:border-white/10 shadow-inner">
                  <button 
                    onClick={() => onSetMergeMode(MergeMode.STRICT)}
                    className={`px-6 py-2 text-xs font-black rounded-xl transition-all ${mergeMode === MergeMode.STRICT ? 'bg-white text-gray-900 dark:text-black shadow-lg shadow-black/5' : 'text-gray-400 dark:text-gray-500 hover:text-gray-900 dark:hover:text-white'}`}
                  >
                    STRICT
                  </button>
                  <button 
                    onClick={() => onSetMergeMode(MergeMode.LENIENT)}
                    className={`px-6 py-2 text-xs font-black rounded-xl transition-all ${mergeMode === MergeMode.LENIENT ? 'bg-white text-gray-900 dark:text-black shadow-lg shadow-black/5' : 'text-gray-400 dark:text-gray-500 hover:text-gray-900 dark:hover:text-white'}`}
                  >
                    LENIENT
                  </button>
                </div>
              </div>

              <button
                onClick={onMerge}
                disabled={mergeMode === MergeMode.STRICT && hasErrors}
                className="group relative px-10 py-5 bg-violet-600 hover:bg-violet-700 text-white rounded-[20px] font-black transition-all shadow-xl shadow-violet-500/20 disabled:opacity-30 disabled:shadow-none flex items-center gap-4 overflow-hidden"
              >
                <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <span className="relative z-10 tracking-widest uppercase text-sm">Merge Stack</span>
                <svg className="w-5 h-5 relative z-10 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </button>
            </div>
            {mergeMode === MergeMode.STRICT && hasErrors && (
              <div className="mt-6 p-4 rounded-xl bg-red-500/5 dark:bg-red-500/10 border border-red-500/10 dark:border-red-500/20 text-center">
                <p className="text-[10px] text-red-500 dark:text-red-400 font-black uppercase tracking-widest">Resolve Errors to Initiate Strict Merge</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalysisPanel;
