
import React, { useState, useCallback, useEffect } from 'react';
import { DartFile, AnalysisResult, MergeMode, MergeStats } from './types';
import { DartParser } from './engine/dartParser';
import FileUpload from './components/FileUpload';
import FileList from './components/FileList';
import AnalysisPanel from './components/AnalysisPanel';
import CodePreview from './components/CodePreview';
import { Header } from './components/Header';
import { Footer } from './components/Footer';

const SESSION_KEY = 'dsl_session_v1';

const App: React.FC = () => {
  const [files,        setFiles]        = useState<DartFile[]>([]);
  const [analysis,     setAnalysis]     = useState<AnalysisResult | null>(null);
  const [mergedCode,   setMergedCode]   = useState<string | null>(null);
  const [mergeStats,   setMergeStats]   = useState<MergeStats | null>(null);
  const [mergeMode,    setMergeMode]    = useState<MergeMode>(MergeMode.LENIENT);
  const [isAnalyzing,  setIsAnalyzing]  = useState(false);
  const [isDark,       setIsDark]       = useState(true);
  const [dupeWarning,  setDupeWarning]  = useState<string | null>(null);

  // ── Theme ──────────────────────────────────────────────────
  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
  }, [isDark]);

  // ── Session Persistence (restore on mount) ─────────────────
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(SESSION_KEY);
      if (saved) {
        const { files: savedFiles } = JSON.parse(saved) as { files: DartFile[] };
        if (Array.isArray(savedFiles) && savedFiles.length > 0) setFiles(savedFiles);
      }
    } catch (_) { /* ignore corrupt session */ }
  }, []);

  // ── Session Persistence (save on change) ──────────────────
  useEffect(() => {
    try {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify({ files }));
    } catch (_) { /* storage quota reached */ }
  }, [files]);

  // ── Handlers ───────────────────────────────────────────────
  const handleFilesAdded = (newFiles: DartFile[], dupes: string[]) => {
    if (dupes.length > 0) {
      setDupeWarning(`Skipped ${dupes.length} duplicate file(s): ${dupes.join(', ')}`);
      setTimeout(() => setDupeWarning(null), 5000);
    }
    if (newFiles.length > 0) {
      setFiles(prev => [...prev, ...newFiles]);
      setAnalysis(null);
      setMergedCode(null);
      setMergeStats(null);
    }
  };

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
    setAnalysis(null);
    setMergedCode(null);
    setMergeStats(null);
  };

  const reorderFiles = (reordered: DartFile[]) => {
    setFiles(reordered);
    setMergedCode(null);
    setMergeStats(null);
  };

  const runAnalysis = useCallback(() => {
    if (files.length === 0) return;
    setIsAnalyzing(true);
    setTimeout(() => {
      const result = DartParser.analyzeFiles(files);
      setAnalysis(result);
      setIsAnalyzing(false);
    }, 600);
  }, [files]);

  const runMerge = useCallback(() => {
    if (!analysis) return;
    const code = DartParser.merge(files, analysis, mergeMode);

    // Compute stats
    const totalInputLines = files.reduce((s, f) => s + f.content.split('\n').length, 0);
    const totalInputBytes = files.reduce((s, f) => s + f.size, 0);
    const outputBytes     = new TextEncoder().encode(code).length;
    const autoResolved    = mergeMode === MergeMode.LENIENT
      ? analysis.conflicts.filter(c => c.severity === 'warning').length
      : 0;

    setMergeStats({
      totalInputFiles:      files.length,
      totalInputLines,
      totalInputBytes,
      outputLines:          code.split('\n').length,
      outputBytes,
      importsDeduped:       Math.max(0, analysis.rawImportCount - analysis.imports.length),
      unusedImports:        analysis.unusedImports.length,
      conflictsAutoResolved: autoResolved,
    });

    setMergedCode(code);
    setTimeout(() => document.getElementById('preview-section')?.scrollIntoView({ behavior: 'smooth' }), 100);
  }, [files, analysis, mergeMode]);

  const reset = () => {
    setFiles([]);
    setAnalysis(null);
    setMergedCode(null);
    setMergeStats(null);
    setDupeWarning(null);
    sessionStorage.removeItem(SESSION_KEY);
  };

  const existingFileNames = new Set(files.map(f => f.name));

  return (
    <div className="min-h-screen flex flex-col font-sans transition-colors duration-500">
      <Header onReset={reset} isDark={isDark} onToggleTheme={() => setIsDark(!isDark)} />

      <main className="flex-grow container mx-auto px-6 py-12 max-w-7xl">

        {/* Intro */}
        {!analysis && files.length === 0 && (
          <div className="max-w-3xl mx-auto text-center mb-16 space-y-6">
            <div className="inline-block px-4 py-1.5 rounded-full glass border-violet-500/30 text-violet-600 dark:text-violet-400 text-[10px] font-black uppercase tracking-[0.2em] mb-4">
              Now with AST Analysis v3.0
            </div>
            <h1 className="text-5xl md:text-7xl font-extrabold text-gray-900 dark:text-white tracking-tighter leading-[1.1]">
              The unified engine for{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-cyan-500 dark:from-violet-400 dark:to-cyan-300">
                Dart Architecture.
              </span>
            </h1>
            <p className="text-lg text-gray-500 dark:text-gray-400 max-w-xl mx-auto font-medium">
              Combine, optimize, and sanitize your Flutter source files with deterministic precision and real-time collision detection.
            </p>
          </div>
        )}

        {/* Duplicate Warning Banner */}
        {dupeWarning && (
          <div className="mb-6 flex items-center justify-between px-5 py-3 rounded-2xl bg-yellow-500/10 border border-yellow-500/30 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="flex items-center gap-3">
              <span className="w-2 h-2 rounded-full bg-yellow-400"></span>
              <p className="text-sm text-yellow-700 dark:text-yellow-300 font-medium">{dupeWarning}</p>
            </div>
            <button onClick={() => setDupeWarning(null)} className="text-yellow-500 hover:text-yellow-300 transition-colors text-lg">×</button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">

          {/* Workspace */}
          <div className={`${analysis ? 'lg:col-span-5' : 'lg:col-span-8 lg:col-start-3'} space-y-8 transition-all duration-700`}>
            <section className="space-y-6">
              <FileUpload existingFileNames={existingFileNames} onFilesAdded={handleFilesAdded} />

              {files.length > 0 && (
                <div className="animate-in fade-in slide-in-from-top-4 duration-500">
                  <div className="flex justify-between items-center mb-6 px-2">
                    <h3 className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.3em]">
                      Processing Stack ({files.length})
                    </h3>
                    {files.length > 0 && (
                      <span className="text-[10px] text-gray-500 font-mono">
                        {(files.reduce((s, f) => s + f.size, 0) / 1024).toFixed(1)} KB total
                      </span>
                    )}
                  </div>
                  <FileList files={files} onRemove={removeFile} onReorder={reorderFiles} />

                  <div className="mt-8 flex justify-center">
                    <button
                      onClick={runAnalysis}
                      disabled={isAnalyzing}
                      className="group relative px-12 py-4 bg-violet-600 text-white dark:bg-white dark:text-black rounded-2xl font-black transition-all hover:bg-violet-700 dark:hover:bg-violet-400 dark:hover:text-white disabled:opacity-50 flex items-center gap-3 overflow-hidden shadow-xl shadow-violet-500/20"
                    >
                      <div className="absolute inset-0 bg-violet-600/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      <span className="relative z-10 uppercase tracking-widest text-xs">Run Structural Analysis</span>
                      {isAnalyzing && (
                        <svg className="animate-spin h-4 w-4 relative z-10" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </section>
          </div>

          {/* Analysis Panel */}
          {analysis && (
            <div className="lg:col-span-7 space-y-8">
              <AnalysisPanel
                analysis={analysis}
                mergeMode={mergeMode}
                onSetMergeMode={setMergeMode}
                onMerge={runMerge}
              />
            </div>
          )}
        </div>

        {/* Output */}
        {mergedCode && mergeStats && (
          <section id="preview-section" className="mt-20 max-w-6xl mx-auto">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 rounded-2xl bg-violet-600/20 flex items-center justify-center border border-violet-500/30">
                <svg className="w-6 h-6 text-violet-600 dark:text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Generated Assembly</h2>
                <p className="text-xs text-gray-500 uppercase tracking-widest font-bold">Optimized Output Stream</p>
              </div>
            </div>
            <CodePreview
              code={mergedCode}
              stats={mergeStats}
              onDownload={() => {
                const blob = new Blob([mergedCode], { type: 'text/plain' });
                const url  = URL.createObjectURL(blob);
                const a    = document.createElement('a');
                a.href     = url;
                a.download = 'streamline_assembly.dart';
                a.click();
                URL.revokeObjectURL(url);
              }}
            />
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default App;
