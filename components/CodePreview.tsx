
import React, { useState } from 'react';
import { MergeStats } from '../types';

interface Props {
  code: string;
  stats: MergeStats;
  onDownload: () => void;
}

// ─── Dart Syntax Tokenizer ────────────────────────────────────
type TokenType = 'comment' | 'string' | 'annotation' | 'keyword' |
  'builtin-type' | 'number' | 'operator' | 'punctuation' | 'default';

interface Token { text: string; type: TokenType }

const DART_KEYWORDS = new Set([
  'import', 'export', 'library', 'part', 'show', 'hide', 'as', 'deferred',
  'class', 'abstract', 'sealed', 'base', 'interface', 'final', 'mixin',
  'enum', 'extension', 'typedef', 'implements', 'extends', 'with', 'on',
  'void', 'var', 'late', 'static', 'dynamic', 'covariant', 'external',
  'return', 'if', 'else', 'for', 'while', 'do', 'switch', 'case', 'default',
  'break', 'continue', 'new', 'this', 'super', 'null', 'true', 'false',
  'try', 'catch', 'finally', 'rethrow', 'throw',
  'async', 'await', 'yield', 'sync', 'get', 'set', 'in', 'is',
  'required', 'const', 'factory', 'operator', 'assert',
]);

const DART_TYPES = new Set([
  'String', 'int', 'double', 'bool', 'num', 'List', 'Map', 'Set',
  'Iterable', 'Future', 'Stream', 'Object', 'Never', 'Null',
  'Function', 'Symbol', 'Type', 'Duration', 'DateTime', 'RegExp',
  'Widget', 'State', 'BuildContext', 'Key', 'GlobalKey',
]);

function tokenizeLine(line: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  const n = line.length;

  while (i < n) {
    // Line comment
    if (line[i] === '/' && line[i + 1] === '/') {
      tokens.push({ text: line.slice(i), type: 'comment' });
      break;
    }

    // String literal (single or double quote, handles escape)
    if (line[i] === '"' || line[i] === "'") {
      const q = line[i];
      let j = i + 1;
      while (j < n && line[j] !== q) {
        if (line[j] === '\\') j++;
        j++;
      }
      tokens.push({ text: line.slice(i, j + 1), type: 'string' });
      i = j + 1;
      continue;
    }

    // Raw string: r'...' r"..."
    if (line[i] === 'r' && i + 1 < n && (line[i + 1] === '"' || line[i + 1] === "'")) {
      const q = line[i + 1];
      let j = i + 2;
      while (j < n && line[j] !== q) j++;
      tokens.push({ text: line.slice(i, j + 1), type: 'string' });
      i = j + 1;
      continue;
    }

    // Annotation
    if (line[i] === '@') {
      let j = i + 1;
      while (j < n && /[\w$]/.test(line[j])) j++;
      if (j < n && line[j] === '(') {
        let depth = 1; j++;
        while (j < n && depth > 0) {
          if (line[j] === '(') depth++;
          if (line[j] === ')') depth--;
          j++;
        }
      }
      tokens.push({ text: line.slice(i, j), type: 'annotation' });
      i = j;
      continue;
    }

    // Number
    if (/\d/.test(line[i])) {
      let j = i;
      while (j < n && /[\d.xXa-fA-F_]/.test(line[j])) j++;
      tokens.push({ text: line.slice(i, j), type: 'number' });
      i = j;
      continue;
    }

    // Identifier, keyword, or type
    if (/[a-zA-Z_$]/.test(line[i])) {
      let j = i;
      while (j < n && /[\w$]/.test(line[j])) j++;
      const word = line.slice(i, j);
      let type: TokenType = 'default';
      if (DART_KEYWORDS.has(word)) type = 'keyword';
      else if (DART_TYPES.has(word)) type = 'builtin-type';
      tokens.push({ text: word, type });
      i = j;
      continue;
    }

    // Punctuation
    if ('{}();,[]'.includes(line[i])) {
      tokens.push({ text: line[i], type: 'punctuation' });
    } else if ('=<>!&|+-*/%^~?:.'.includes(line[i])) {
      tokens.push({ text: line[i], type: 'operator' });
    } else {
      tokens.push({ text: line[i], type: 'default' });
    }
    i++;
  }

  return tokens;
}

const TOKEN_COLORS: Record<TokenType, string> = {
  comment:      'text-gray-600 italic',
  string:       'text-emerald-400',
  annotation:   'text-yellow-400',
  keyword:      'text-violet-400 font-semibold',
  'builtin-type': 'text-cyan-400',
  number:       'text-amber-400',
  operator:     'text-rose-300',
  punctuation:  'text-gray-400',
  default:      'text-gray-300',
};

// ─── Stats Bar ────────────────────────────────────────────────
const StatItem: React.FC<{ label: string; value: string | number; accent?: string }> = ({ label, value, accent }) => (
  <div className="flex flex-col items-center gap-0.5">
    <span className={`text-base font-extrabold ${accent ?? 'text-white'}`}>{value}</span>
    <span className="text-[9px] text-gray-500 uppercase tracking-widest font-bold">{label}</span>
  </div>
);

function fmtBytes(b: number): string {
  if (b < 1024) return `${b}B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)}KB`;
  return `${(b / 1024 / 1024).toFixed(2)}MB`;
}

// ─── Component ────────────────────────────────────────────────
const CodePreview: React.FC<Props> = ({ code, stats, onDownload }) => {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const lines = code.split('\n');

  return (
    <div className="glass rounded-[32px] shadow-2xl border border-white/10 overflow-hidden animate-in fade-in zoom-in duration-500">

      {/* Stats Bar */}
      <div className="bg-[#0d0d14] border-b border-white/5 px-8 py-4">
        <div className="flex items-center justify-between">
          <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Merge Report</span>
          <div className="flex items-center gap-6 divide-x divide-white/5">
            <div className="flex items-center gap-5 pr-6">
              <StatItem label="Input Files"  value={stats.totalInputFiles} />
              <StatItem label="Input Lines"  value={stats.totalInputLines.toLocaleString()} />
              <StatItem label="Input Size"   value={fmtBytes(stats.totalInputBytes)} />
            </div>
            <div className="flex items-center gap-5 pl-6">
              <StatItem label="Output Lines" value={stats.outputLines.toLocaleString()} accent="text-violet-400" />
              <StatItem label="Output Size"  value={fmtBytes(stats.outputBytes)} accent="text-violet-400" />
            </div>
            <div className="flex items-center gap-5 pl-6">
              <StatItem label="Imports Deduped"   value={stats.importsDeduped}       accent="text-cyan-400" />
              <StatItem label="Unused Flagged"    value={stats.unusedImports}         accent={stats.unusedImports > 0 ? 'text-yellow-400' : 'text-gray-500'} />
              <StatItem label="Conflicts Fixed"   value={stats.conflictsAutoResolved} accent={stats.conflictsAutoResolved > 0 ? 'text-orange-400' : 'text-gray-500'} />
            </div>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-[#09090b] px-8 py-4 flex justify-between items-center border-b border-white/5">
        <div className="flex items-center gap-4">
          <div className="flex gap-2">
            <div className="w-3 h-3 rounded-full bg-[#ff5f56]"></div>
            <div className="w-3 h-3 rounded-full bg-[#ffbd2e]"></div>
            <div className="w-3 h-3 rounded-full bg-[#27c93f]"></div>
          </div>
          <div className="h-5 w-px bg-white/10 mx-1"></div>
          <span className="text-gray-400 text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
            <svg className="w-3 h-3 text-blue-400" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2L4.5 20.29L5.21 21L12 18L18.79 21L19.5 20.29L12 2Z"/>
            </svg>
            merged_output.dart
            <span className="ml-2 text-gray-700">{lines.length} lines</span>
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={copyToClipboard}
            className="px-4 py-1.5 text-[10px] font-black rounded-lg border border-white/10 text-gray-400 hover:text-white hover:border-white/30 transition-all flex items-center gap-2 uppercase tracking-widest"
          >
            {copied
              ? <span className="text-green-400">✓ Copied</span>
              : <span>Copy</span>}
          </button>
          <button
            onClick={onDownload}
            className="px-6 py-1.5 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-[10px] font-black transition-all shadow-lg shadow-violet-500/20 uppercase tracking-widest"
          >
            Download .dart
          </button>
        </div>
      </div>

      {/* Syntax-highlighted Code */}
      <div className="p-6 bg-[#020617] max-h-[680px] overflow-auto custom-scrollbar">
        <pre className="text-sm font-mono leading-6">
          <code className="block">
            {lines.map((line, i) => {
              const tokens = tokenizeLine(line);
              return (
                <div key={i} className="flex gap-5 hover:bg-white/[0.015] transition-colors px-3 -mx-3 group">
                  <span className="w-10 text-gray-700 text-right select-none font-mono text-xs pt-0.5 flex-shrink-0 group-hover:text-gray-500">
                    {i + 1}
                  </span>
                  <span className="flex-1">
                    {tokens.length === 0
                      ? <span className="text-transparent">{'​'}</span>
                      : tokens.map((tok, j) => (
                          <span key={j} className={TOKEN_COLORS[tok.type]}>{tok.text}</span>
                        ))
                    }
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
