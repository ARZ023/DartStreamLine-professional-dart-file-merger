
import React, { useState } from 'react';
import { AnalysisResult, MergeMode } from '../types';

interface Props {
  analysis: AnalysisResult;
  mergeMode: MergeMode;
  onSetMergeMode: (mode: MergeMode) => void;
  onMerge: () => void;
}

const AnalysisPanel: React.FC<Props> = ({ analysis, mergeMode, onSetMergeMode, onMerge }) => {
  const hasErrors = analysis.conflicts.some(c => c.severity === 'error');
  const [showDecls, setShowDecls] = useState(false);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="glass rounded-3xl border border-gray-200 dark:border-white/10 overflow-hidden shadow-2xl shadow-black/5 dark:shadow-black/50">

        {/* Header */}
        <div className="bg-gray-50/50 dark:bg-white/5 border-b border-gray-200 dark:border-white/5 px-8 py-6 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Analysis Hub</h2>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 uppercase tracking-tighter">Real-time code structure telemetry</p>
          </div>
          <div className="flex gap-3 flex-wrap">
            <div className="flex items-center gap-2 bg-white/50 dark:bg-white/5 px-3 py-2 rounded-2xl border border-gray-200 dark:border-white/5">
              <span className="w-2 h-2 bg-violet-500 rounded-full shadow-[0_0_10px_rgba(139,92,246,0.6)]"></span>
              <span className="text-xs font-black text-gray-700 dark:text-gray-300 uppercase tracking-widest">{analysis.imports.length} Imports</span>
            </div>
            {analysis.unusedImports.length > 0 && (
              <div className="flex items-center gap-2 bg-yellow-500/10 px-3 py-2 rounded-2xl border border-yellow-500/20">
                <span className="w-2 h-2 bg-yellow-400 rounded-full"></span>
                <span className="text-xs font-black text-yellow-700 dark:text-yellow-400 uppercase tracking-widest">{analysis.unusedImports.length} Unused</span>
              </div>
            )}
            {analysis.libraryName && (
              <div className="flex items-center gap-2 bg-cyan-500/10 px-3 py-2 rounded-2xl border border-cyan-500/20">
                <span className="text-xs font-black text-cyan-600 dark:text-cyan-400 font-mono">{analysis.libraryName}</span>
              </div>
            )}
          </div>
        </div>

        <div className="p-8 space-y-8">

          {/* Visual Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'Imports',     value: analysis.imports.length,     color: 'violet', icon: '📦' },
              { label: 'Symbols',     value: analysis.declarations.length, color: 'cyan',   icon: '🔬' },
              { label: 'Conflicts',   value: analysis.conflicts.length,    color: analysis.conflicts.length > 0 ? 'red' : 'green', icon: '⚠️' },
              { label: 'Unused',      value: analysis.unusedImports.length,color: analysis.unusedImports.length > 0 ? 'yellow' : 'green', icon: '🔍' },
            ].map(({ label, value, color, icon }) => (
              <div key={label} className={`p-5 rounded-2xl bg-gradient-to-br from-${color}-600/10 to-transparent border border-${color}-500/10 dark:border-${color}-500/20`}>
                <div className="text-2xl mb-1">{icon}</div>
                <span className="text-3xl font-extrabold text-gray-900 dark:text-white">{value}</span>
                <p className={`text-[10px] text-${color}-600 dark:text-${color}-400 mt-1 font-black uppercase tracking-[0.2em]`}>{label}</p>
              </div>
            ))}
          </div>

          {/* Part Directive Warnings */}
          {analysis.warnings.length > 0 && (
            <div>
              <h3 className="text-sm font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-3">Part Directive Warnings</h3>
              <div className="space-y-2">
                {analysis.warnings.map((warn, i) => (
                  <div key={i} className="p-4 rounded-2xl border bg-yellow-500/5 border-yellow-500/20 flex gap-3 items-start">
                    <div className="mt-1 w-2 h-2 rounded-full bg-yellow-400 flex-shrink-0" />
                    <p className="text-xs text-yellow-700 dark:text-yellow-300 leading-relaxed">{warn}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Unused Imports */}
          {analysis.unusedImports.length > 0 && (
            <div>
              <h3 className="text-sm font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-3">Possibly Unused Imports</h3>
              <div className="space-y-2">
                {analysis.unusedImports.map((imp, i) => (
                  <div key={i} className="px-4 py-3 rounded-xl border bg-yellow-500/5 border-yellow-500/10 flex items-center justify-between">
                    <code className="text-xs text-yellow-700 dark:text-yellow-300 font-mono truncate max-w-[70%]">{imp.path}</code>
                    <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 uppercase tracking-widest">
                      {imp.type}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Conflicts */}
          <div>
            <h3 className="text-sm font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-3">System Diagnostics</h3>
            {analysis.conflicts.length > 0 ? (
              <div className="space-y-3">
                {analysis.conflicts.map((conflict, i) => (
                  <div
                    key={i}
                    className={`p-5 rounded-2xl border transition-all hover:translate-x-1 ${
                      conflict.severity === 'error'
                        ? 'bg-red-500/5 border-red-500/20'
                        : 'bg-orange-500/5 border-orange-500/20'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${conflict.severity === 'error' ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)]' : 'bg-orange-500'}`}></div>
                        <span className="text-sm font-bold text-gray-900 dark:text-white">{conflict.name}</span>
                        <span className="text-[10px] text-gray-500 font-mono">({conflict.type})</span>
                      </div>
                      <span className={`text-[10px] font-black px-2 py-1 rounded-lg uppercase tracking-widest ${
                        conflict.severity === 'error' ? 'bg-red-500/20 text-red-500' : 'bg-orange-500/20 text-orange-500'
                      }`}>
                        {conflict.severity}
                      </span>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <span className="text-[10px] text-gray-400 uppercase font-bold mr-1">In:</span>
                      {conflict.sources.map((src, j) => (
                        <span key={j} className="text-[10px] bg-gray-100 dark:bg-white/5 px-2.5 py-1 rounded-full border border-gray-200 dark:border-white/5 text-gray-600 dark:text-gray-300 font-medium">{src}</span>
                      ))}
                    </div>
                    {/* Rename Preview */}
                    {conflict.severity === 'warning' && Object.keys(conflict.renamePreview).length > 0 && (
                      <div className="mt-3 pt-3 border-t border-orange-500/10">
                        <span className="text-[9px] font-black text-orange-400 uppercase tracking-widest">LENIENT auto-rename preview:</span>
                        <div className="mt-1.5 flex flex-wrap gap-2">
                          {Object.entries(conflict.renamePreview).map(([src, newName]) => (
                            <div key={src} className="flex items-center gap-1.5 text-[10px]">
                              <span className="text-gray-500 font-mono">{src.replace('.dart', '')}:</span>
                              <span className="text-gray-400 font-mono line-through">{conflict.name}</span>
                              <span className="text-orange-400">→</span>
                              <code className="text-green-400 font-mono font-bold">{newName}</code>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-10 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-3xl flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h4 className="font-bold text-gray-900 dark:text-white">System Integrity: Nominal</h4>
                <p className="text-sm text-gray-500 mt-2">Zero structural collisions detected.</p>
              </div>
            )}
          </div>

          {/* Declarations List (collapsible) */}
          {analysis.declarations.length > 0 && (
            <div>
              <button
                onClick={() => setShowDecls(d => !d)}
                className="flex items-center gap-2 text-sm font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-3 hover:text-gray-700 dark:hover:text-white transition-colors"
              >
                <span>Identified Symbols ({analysis.declarations.length})</span>
                <svg className={`w-4 h-4 transition-transform ${showDecls ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {showDecls && (
                <div className="max-h-64 overflow-y-auto custom-scrollbar space-y-1.5 pr-1">
                  {analysis.declarations.map((decl, i) => (
                    <div key={i} className="px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 min-w-0">
                        <span className={`mt-0.5 text-[9px] font-black px-1.5 py-0.5 rounded-md uppercase tracking-widest flex-shrink-0 ${
                          decl.type === 'class'     ? 'bg-violet-500/20 text-violet-500' :
                          decl.type === 'enum'      ? 'bg-cyan-500/20 text-cyan-500' :
                          decl.type === 'mixin'     ? 'bg-blue-500/20 text-blue-500' :
                          decl.type === 'function'  ? 'bg-amber-500/20 text-amber-500' :
                          decl.type === 'extension' ? 'bg-pink-500/20 text-pink-500' :
                                                      'bg-gray-500/20 text-gray-500'
                        }`}>
                          {decl.type}
                        </span>
                        <div className="min-w-0">
                          <span className="text-sm font-bold text-gray-900 dark:text-white">{decl.name}</span>
                          {decl.annotations.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {decl.annotations.map((ann, j) => (
                                <span key={j} className="text-[9px] font-mono text-yellow-600 dark:text-yellow-400 bg-yellow-500/10 px-1.5 py-0.5 rounded-md">{ann}</span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      <span className="text-[9px] text-gray-400 font-mono truncate flex-shrink-0 max-w-[40%]">{decl.sourceFile}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Action Hub */}
          <div className="pt-6 border-t border-gray-200 dark:border-white/5">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-6">
              <div className="space-y-2">
                <span className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Merge Strategy</span>
                <div className="flex p-1.5 bg-gray-100 dark:bg-[#09090b] rounded-2xl border border-gray-200 dark:border-white/10 shadow-inner">
                  <button
                    onClick={() => onSetMergeMode(MergeMode.STRICT)}
                    title="Blocks merge if any naming conflicts exist. No auto-renaming."
                    className={`px-6 py-2 text-xs font-black rounded-xl transition-all ${mergeMode === MergeMode.STRICT ? 'bg-white text-gray-900 dark:text-black shadow-lg' : 'text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}
                  >
                    STRICT
                  </button>
                  <button
                    onClick={() => onSetMergeMode(MergeMode.LENIENT)}
                    title="Auto-renames conflicting symbols with a _filename suffix."
                    className={`px-6 py-2 text-xs font-black rounded-xl transition-all ${mergeMode === MergeMode.LENIENT ? 'bg-white text-gray-900 dark:text-black shadow-lg' : 'text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}
                  >
                    LENIENT
                  </button>
                </div>
                <p className="text-[10px] text-gray-400 dark:text-gray-500">
                  {mergeMode === MergeMode.LENIENT
                    ? '⚡ Conflicting symbols auto-renamed with _filename suffix'
                    : '🔒 Merge blocked until all naming errors are resolved'}
                </p>
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
              <div className="mt-5 p-4 rounded-xl bg-red-500/5 border border-red-500/10 text-center">
                <p className="text-[10px] text-red-500 font-black uppercase tracking-widest">Resolve Errors to Initiate Strict Merge</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalysisPanel;
