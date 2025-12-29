
import React, { useState, useCallback, useEffect } from 'react';
import { DartFile, AnalysisResult, MergeMode } from './types';
import { DartParser } from './engine/dartParser';
import FileUpload from './components/FileUpload';
import FileList from './components/FileList';
import AnalysisPanel from './components/AnalysisPanel';
import CodePreview from './components/CodePreview';
import { Header } from './components/Header';
import { Footer } from './components/Footer';

const App: React.FC = () => {
  const [files, setFiles] = useState<DartFile[]>([]);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [mergedCode, setMergedCode] = useState<string | null>(null);
  const [mergeMode, setMergeMode] = useState<MergeMode>(MergeMode.LENIENT);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  const toggleTheme = () => setIsDark(!isDark);

  const handleFilesAdded = (newFiles: DartFile[]) => {
    setFiles(prev => [...prev, ...newFiles]);
    setAnalysis(null);
    setMergedCode(null);
  };

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
    setAnalysis(null);
    setMergedCode(null);
  };

  const reorderFiles = (reordered: DartFile[]) => {
    setFiles(reordered);
    setMergedCode(null);
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
    const code = DartParser.merge(files, analysis);
    setMergedCode(code);
    
    setTimeout(() => {
      const previewEl = document.getElementById('preview-section');
      previewEl?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  }, [files, analysis]);

  const reset = () => {
    setFiles([]);
    setAnalysis(null);
    setMergedCode(null);
  };

  return (
    <div className="min-h-screen flex flex-col font-sans transition-colors duration-500">
      <Header onReset={reset} isDark={isDark} onToggleTheme={toggleTheme} />

      <main className="flex-grow container mx-auto px-6 py-12 max-w-7xl">
        {/* Modern Intro Section */}
        {!analysis && files.length === 0 && (
          <div className="max-w-3xl mx-auto text-center mb-16 space-y-6">
            <div className="inline-block px-4 py-1.5 rounded-full glass border-violet-500/30 text-violet-600 dark:text-violet-400 text-[10px] font-black uppercase tracking-[0.2em] mb-4">
              Now with AST Analysis v3.0
            </div>
            <h1 className="text-5xl md:text-7xl font-extrabold text-gray-900 dark:text-white tracking-tighter leading-[1.1]">
              The unified engine for <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-cyan-500 dark:from-violet-400 dark:to-cyan-300">Dart Architecture.</span>
            </h1>
            <p className="text-lg text-gray-500 dark:text-gray-400 max-w-xl mx-auto font-medium">
              Combine, optimize, and sanitize your Flutter source files with deterministic precision and real-time collision detection.
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          
          {/* Workspace Area */}
          <div className={`${analysis ? 'lg:col-span-5' : 'lg:col-span-8 lg:col-start-3'} space-y-8 transition-all duration-700`}>
            <section className="space-y-6">
              <FileUpload onFilesAdded={handleFilesAdded} />
              
              {files.length > 0 && (
                <div className="animate-in fade-in slide-in-from-top-4 duration-500">
                  <div className="flex justify-between items-center mb-6 px-2">
                    <h3 className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.3em]">Processing Stack ({files.length})</h3>
                  </div>
                  <FileList 
                    files={files} 
                    onRemove={removeFile} 
                    onReorder={reorderFiles} 
                  />
                  
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

          {/* Analysis View */}
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

        {/* Output View */}
        {mergedCode && (
          <section id="preview-section" className="mt-20 max-w-6xl mx-auto">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 rounded-2xl bg-violet-600/20 flex items-center justify-center border border-violet-500/30">
                <svg className="w-6 h-6 text-violet-600 dark:text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Generated Assembly</h2>
                <p className="text-xs text-gray-500 uppercase tracking-widest font-bold">Optimized Output Stream</p>
              </div>
            </div>
            <CodePreview 
              code={mergedCode} 
              onDownload={() => {
                const blob = new Blob([mergedCode], { type: 'text/plain' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'streamline_assembly.dart';
                a.click();
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
