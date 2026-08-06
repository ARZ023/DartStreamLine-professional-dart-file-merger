
import React, { useRef, useState } from 'react';
import { DartFile } from '../types';

interface Props {
  existingFileNames: Set<string>;
  onFilesAdded: (files: DartFile[], dupes: string[]) => void;
}

const FileUpload: React.FC<Props> = ({ existingFileNames, onFilesAdded }) => {
  const fileInputRef    = useRef<HTMLInputElement>(null);
  const folderInputRef  = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging]  = useState(false);

  const processFiles = async (fileList: FileList | null) => {
    if (!fileList) return;

    const fresh: DartFile[] = [];
    const dupes: string[] = [];

    await Promise.all(
      Array.from(fileList).map(file =>
        new Promise<void>(resolve => {
          if (!file.name.endsWith('.dart')) { resolve(); return; }

          if (existingFileNames.has(file.name)) {
            dupes.push(file.name);
            resolve();
            return;
          }

          const reader = new FileReader();
          reader.onload = e => {
            fresh.push({
              id: Math.random().toString(36).slice(2, 11),
              name: file.name,
              content: e.target?.result as string,
              size: file.size,
            });
            resolve();
          };
          reader.readAsText(file);
        })
      )
    );

    onFilesAdded(fresh, dupes);
    if (fileInputRef.current)   fileInputRef.current.value = '';
    if (folderInputRef.current) folderInputRef.current.value = '';
    setIsDragging(false);
  };

  return (
    <div className="space-y-3">
      {/* Drop Zone */}
      <div
        className={`relative group cursor-pointer transition-all duration-500 rounded-3xl p-1
          ${isDragging
            ? 'bg-gradient-to-br from-violet-500 to-cyan-400 shadow-[0_0_40px_-10px_rgba(139,92,246,0.6)]'
            : 'bg-gray-900/5 dark:bg-white/5 hover:bg-gray-900/10 dark:hover:bg-white/10'
          }`}
        onClick={() => fileInputRef.current?.click()}
        onDragEnter={() => setIsDragging(true)}
        onDragLeave={() => setIsDragging(false)}
        onDragOver={e => { e.preventDefault(); e.stopPropagation(); }}
        onDrop={e => { e.preventDefault(); e.stopPropagation(); processFiles(e.dataTransfer.files); }}
      >
        <div className="bg-white dark:bg-[#09090b] rounded-[22px] p-10 flex flex-col items-center justify-center gap-5 border border-gray-200 dark:border-white/5 group-hover:border-violet-500/30 transition-colors">
          <input
            type="file" multiple accept=".dart" className="hidden"
            ref={fileInputRef}
            onChange={e => processFiles(e.currentTarget.files)}
          />

          <div className="relative">
            <div className="absolute inset-0 bg-violet-600 blur-3xl opacity-10 dark:opacity-20 group-hover:opacity-30 transition-opacity"></div>
            <div className={`w-20 h-20 rounded-2xl flex items-center justify-center border transition-all duration-500
              ${isDragging
                ? 'bg-violet-600 border-white/50 scale-110 rotate-3 shadow-2xl'
                : 'bg-gray-100 dark:bg-white/5 border-gray-200 dark:border-white/10 group-hover:scale-110 group-hover:border-violet-500/50'}`}
            >
              <svg className={`w-10 h-10 transition-colors ${isDragging ? 'text-white' : 'text-gray-400 group-hover:text-violet-600 dark:group-hover:text-violet-400'}`}
                fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
            </div>
          </div>

          <div className="text-center">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">Assemble Files</h3>
            <p className="text-sm text-gray-500">Drop .dart files or click to browse</p>
          </div>

          <div className="flex gap-2">
            <span className="px-3 py-1 bg-gray-100 dark:bg-white/5 rounded-full text-[10px] font-bold text-gray-500 uppercase tracking-tighter border border-gray-200 dark:border-white/5">Multi-Select</span>
            <span className="px-3 py-1 bg-violet-500/10 rounded-full text-[10px] font-bold text-violet-600 dark:text-violet-400 uppercase tracking-tighter border border-violet-500/20">Dupe Guard</span>
          </div>
        </div>
      </div>

      {/* Folder Upload Button */}
      <button
        onClick={() => folderInputRef.current?.click()}
        className="w-full group flex items-center justify-center gap-3 py-3 px-6 rounded-2xl border border-dashed border-gray-300 dark:border-white/10 hover:border-violet-500/50 hover:bg-violet-500/5 transition-all text-sm text-gray-500 dark:text-gray-400 hover:text-violet-600 dark:hover:text-violet-400 font-semibold"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
        </svg>
        Upload Entire Folder (lib/)
        <span className="text-[10px] px-2 py-0.5 bg-violet-500/10 text-violet-500 rounded-full border border-violet-500/20 font-black uppercase tracking-widest">New</span>
      </button>

      {/* @ts-ignore — webkitdirectory is non-standard but widely supported in modern browsers */}
      <input
        type="file"
        multiple
        accept=".dart"
        className="hidden"
        ref={folderInputRef}
        {...{ webkitdirectory: '' }}
        onChange={e => processFiles(e.currentTarget.files)}
      />
    </div>
  );
};

export default FileUpload;
