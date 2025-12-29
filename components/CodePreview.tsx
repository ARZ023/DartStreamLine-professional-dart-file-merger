
import React, { useState } from 'react';

interface Props {
  code: string;
  onDownload: () => void;
}

const CodePreview: React.FC<Props> = ({ code, onDownload }) => {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="glass rounded-[32px] shadow-2xl border border-white/10 overflow-hidden animate-in fade-in zoom-in duration-500">
      <div className="bg-[#09090b] px-8 py-5 flex justify-between items-center border-b border-white/5">
        <div className="flex items-center gap-4">
          <div className="flex gap-2">
            <div className="w-3 h-3 rounded-full bg-[#ff5f56]"></div>
            <div className="w-3 h-3 rounded-full bg-[#ffbd2e]"></div>
            <div className="w-3 h-3 rounded-full bg-[#27c93f]"></div>
          </div>
          <div className="h-6 w-px bg-white/10 mx-2"></div>
          <span className="text-gray-400 text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
            <svg className="w-3 h-3 text-blue-400" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L4.5 20.29L5.21 21L12 18L18.79 21L19.5 20.29L12 2Z"/></svg>
            merged_output.dart
          </span>
        </div>
        
        <div className="flex items-center gap-4">
          <button 
            onClick={copyToClipboard}
            className="px-4 py-2 text-[10px] font-black text-gray-400 hover:text-white transition-all flex items-center gap-2 uppercase tracking-widest"
          >
            {copied ? (
              <span className="text-green-400">Success</span>
            ) : (
              <span>Copy</span>
            )}
          </button>
          <button 
            onClick={onDownload}
            className="px-6 py-2 bg-white text-black hover:bg-violet-400 hover:text-white rounded-xl text-[10px] font-black transition-all shadow-xl shadow-black/20 uppercase tracking-widest"
          >
            Download Source
          </button>
        </div>
      </div>
      
      <div className="p-8 bg-[#020617] max-h-[700px] overflow-auto custom-scrollbar">
        <pre className="text-sm font-mono leading-7">
          <code className="block">
            {code.split('\n').map((line, i) => {
              let lineClass = "text-gray-400";
              if (line.trim().startsWith('import')) lineClass = "text-cyan-400/80";
              else if (line.trim().startsWith('class')) lineClass = "text-violet-400 font-bold";
              else if (line.trim().startsWith('//')) lineClass = "text-gray-600 italic";
              else if (line.trim().includes('main')) lineClass = "text-amber-400";

              return (
                <div key={i} className="flex gap-6 hover:bg-white/[0.02] transition-colors px-4 -mx-4 group">
                  <span className="w-10 text-gray-700 text-right select-none font-mono text-xs pt-0.5 group-hover:text-gray-500">{i + 1}</span>
                  <span className={lineClass}>
                    {line || ' '}
                  </span>
                </div>
              );
            })}
          </code>
        </pre>
      </div>
    </div>
  );
};

export default CodePreview;
