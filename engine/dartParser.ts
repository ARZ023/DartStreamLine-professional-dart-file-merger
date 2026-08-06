
import { DartFile, DartImport, DartDeclaration, AnalysisResult, Conflict, MergeMode } from '../types';

/**
 * DartStreamline Logic Engine v2.0
 *
 * Improvements over v1:
 * 1. Brace-depth tracker for accurate top-level declaration extraction (replaces naive regex)
 * 2. Dedicated `part` / `part of` directive handling — stripped from merged body with warnings
 * 3. Auto-rename strategy: conflicting symbols get a `_<sourceFileBasename>` suffix in LENIENT mode
 * 4. Output normalizer: collapses excess blank lines, strips trailing whitespace per line
 * 5. Export directive parsing alongside imports
 */

export class DartParser {
  // Matches: import/export 'path' [as alias] [show X,Y] [hide A,B];
  private static IMPORT_REGEX =
    /^[ \t]*(import|export)\s+['"]([^'"]+)['"]\s*(?:as\s+([a-zA-Z0-9_$]+)\s*)?(?:show\s+([^;]+?)\s*)?(?:hide\s+([^;]+?)\s*)?;/gm;

  // Matches: part 'path';  (NOT part of)
  private static PART_REGEX = /^[ \t]*part\s+['"]([^'"]+)['"]\s*;/gm;

  // Matches: part of 'path';  or  part of LibraryName;
  private static PART_OF_REGEX = /^[ \t]*part\s+of\s+(?:['"]([^'"]+)['"]|([a-zA-Z0-9_.]+))\s*;/gm;

  // Matches: library libraryName;
  private static LIBRARY_REGEX = /^[ \t]*library\s+[a-zA-Z0-9_.]+\s*;/gm;

  // Top-level declaration keywords
  private static TOP_LEVEL_KEYWORDS = [
    'class', 'abstract class', 'sealed class', 'base class', 'interface class',
    'final class', 'mixin', 'enum', 'extension', 'typedef'
  ];

  // ─────────────────────────────────────────────────────────────
  // PARSE IMPORTS & EXPORTS
  // ─────────────────────────────────────────────────────────────
  static parseImports(content: string): DartImport[] {
    const imports: DartImport[] = [];
    const regex = new RegExp(this.IMPORT_REGEX.source, this.IMPORT_REGEX.flags);
    let match: RegExpExecArray | null;

    while ((match = regex.exec(content)) !== null) {
      const directive = match[1] as 'import' | 'export';
      const path = match[2];
      let type: 'dart' | 'package' | 'relative' = 'relative';
      if (path.startsWith('dart:')) type = 'dart';
      else if (path.startsWith('package:')) type = 'package';

      imports.push({
        raw: match[0].trim(),
        path,
        directive,
        alias: match[3],
        show: match[4]?.split(',').map(s => s.trim()).filter(Boolean),
        hide: match[5]?.split(',').map(s => s.trim()).filter(Boolean),
        type,
      });
    }
    return imports;
  }

  // ─────────────────────────────────────────────────────────────
  // PARSE PART DIRECTIVES
  // ─────────────────────────────────────────────────────────────
  static parseParts(content: string): { parts: string[]; partOfs: string[] } {
    const parts: string[] = [];
    const partOfs: string[] = [];

    const partRegex = new RegExp(this.PART_REGEX.source, this.PART_REGEX.flags);
    let m: RegExpExecArray | null;
    while ((m = partRegex.exec(content)) !== null) parts.push(m[1]);

    const partOfRegex = new RegExp(this.PART_OF_REGEX.source, this.PART_OF_REGEX.flags);
    while ((m = partOfRegex.exec(content)) !== null) partOfs.push(m[1] || m[2]);

    return { parts, partOfs };
  }

  // ─────────────────────────────────────────────────────────────
  // STRIP DIRECTIVES FROM FILE BODY
  // ─────────────────────────────────────────────────────────────
  static stripDirectives(content: string): string {
    return content
      .replace(new RegExp(this.IMPORT_REGEX.source, this.IMPORT_REGEX.flags), '')
      .replace(new RegExp(this.PART_REGEX.source, this.PART_REGEX.flags), '')
      .replace(new RegExp(this.PART_OF_REGEX.source, this.PART_OF_REGEX.flags), '')
      .replace(new RegExp(this.LIBRARY_REGEX.source, this.LIBRARY_REGEX.flags), '');
  }

  // ─────────────────────────────────────────────────────────────
  // BRACE-DEPTH TOP-LEVEL DECLARATION EXTRACTOR
  // Accurately identifies top-level declarations by tracking { } depth.
  // ─────────────────────────────────────────────────────────────
  static extractDeclarations(content: string, sourceFile: string): DartDeclaration[] {
    const declarations: DartDeclaration[] = [];
    const lines = content.split('\n');
    let depth = 0;
    let i = 0;

    while (i < lines.length) {
      const line = lines[i].trim();

      // Track brace depth
      for (const ch of line) {
        if (ch === '{') depth++;
        else if (ch === '}') depth--;
      }

      // Only look for declarations at top level (depth === 0 after the line, or opening brace is on this line)
      if (depth >= 0) {
        // Check for top-level keyword matches at depth 0
        for (const keyword of this.TOP_LEVEL_KEYWORDS) {
          const kw = keyword.split(' ');
          const kwRegex = new RegExp(`^(?:${kw.join('\\s+')}\\s+)([a-zA-Z0-9_$]+)(?:<[^>]*>)?\\s*(?:extends|implements|with|on|=|\\{|;)`);
          const m = kwRegex.exec(line);
          if (m) {
            const declType = kw[kw.length - 1] as DartDeclaration['type'];
            declarations.push({ type: declType, name: m[1], content: '', sourceFile });
            break;
          }
        }

        // Top-level function detection: void/type funcName(
        const funcMatch = /^(?:static\s+)?(?:Future\??|Stream\??|void|bool|int|double|String|dynamic|[A-Z][a-zA-Z0-9_$<>?]*)\s+([a-z][a-zA-Z0-9_$]*)\s*(?:<[^>]*>)?\s*\(/.exec(line);
        if (funcMatch && depth <= 1) {
          declarations.push({ type: 'function', name: funcMatch[1], content: '', sourceFile });
        }
      }

      i++;
    }

    // Special check for main() — deduplicate if already found via function detection
    const hasMain = declarations.some(d => d.name === 'main');
    if (!hasMain && (content.includes('void main(') || /^\s*main\s*\(/m.test(content))) {
      declarations.push({ type: 'function', name: 'main', content: '', sourceFile });
    }

    return declarations;
  }

  // ─────────────────────────────────────────────────────────────
  // NORMALISE OUTPUT
  // Collapses 3+ blank lines → 2, strips trailing whitespace per line
  // ─────────────────────────────────────────────────────────────
  static normalizeOutput(code: string): string {
    return code
      .split('\n')
      .map(line => line.trimEnd())                          // strip trailing whitespace
      .join('\n')
      .replace(/\n{4,}/g, '\n\n\n')                        // collapse 4+ blank lines → 2
      .trim() + '\n';
  }

  // ─────────────────────────────────────────────────────────────
  // ANALYSE ALL FILES
  // ─────────────────────────────────────────────────────────────
  static analyzeFiles(files: DartFile[]): AnalysisResult {
    const allImports: DartImport[] = [];
    const allDeclarations: DartDeclaration[] = [];
    const warnings: string[] = [];
    const partWarnings: string[] = [];

    files.forEach(file => {
      // Parse imports/exports
      allImports.push(...this.parseImports(file.content));

      // Parse part directives
      const { parts, partOfs } = this.parseParts(file.content);
      if (parts.length > 0) {
        partWarnings.push(`"${file.name}" declares ${parts.length} part file(s): ${parts.map(p => `"${p}"`).join(', ')}. Include those files in the stack too for a complete merge.`);
      }
      if (partOfs.length > 0) {
        partWarnings.push(`"${file.name}" is a part-of file (part of ${partOfs.join(', ')}). Its "part of" directive will be stripped in the merge — verify the output is a standalone library.`);
      }

      // Extract declarations using brace-depth analyser
      const cleaned = this.stripDirectives(file.content);
      allDeclarations.push(...this.extractDeclarations(cleaned, file.name));
    });

    warnings.push(...partWarnings);

    // ── Deduplication ──
    const uniqueImportsMap = new Map<string, DartImport>();
    allImports.forEach(imp => {
      const key = `${imp.directive}:${imp.path}::${imp.alias ?? ''}::${(imp.show ?? []).sort().join(',')}::${(imp.hide ?? []).sort().join(',')}`;
      if (!uniqueImportsMap.has(key)) uniqueImportsMap.set(key, imp);
    });

    // ── Conflict Detection ──
    const conflicts: Conflict[] = [];
    const nameMap = new Map<string, string[]>();
    allDeclarations.forEach(d => {
      const existing = nameMap.get(d.name) ?? [];
      nameMap.set(d.name, [...existing, d.sourceFile]);
    });
    nameMap.forEach((sources, name) => {
      if (sources.length > 1) {
        const type = allDeclarations.find(d => d.name === name)?.type ?? 'declaration';
        conflicts.push({
          name,
          type,
          sources,
          severity: name === 'main' ? 'error' : 'warning',
        });
      }
    });

    return {
      imports: Array.from(uniqueImportsMap.values()),
      declarations: allDeclarations,
      conflicts,
      warnings,
    };
  }

  // ─────────────────────────────────────────────────────────────
  // MERGE
  // ─────────────────────────────────────────────────────────────
  static merge(files: DartFile[], analysis: AnalysisResult, mode: MergeMode = MergeMode.LENIENT): string {
    // Build rename map for LENIENT conflict auto-resolution
    const renameMap = new Map<string, Map<string, string>>(); // symbol → (sourceFile → newName)
    if (mode === MergeMode.LENIENT) {
      analysis.conflicts
        .filter(c => c.severity === 'warning') // only rename non-main conflicts
        .forEach(conflict => {
          const fileRenames = new Map<string, string>();
          // Keep first occurrence as-is, rename subsequent occurrences
          conflict.sources.slice(1).forEach(src => {
            const base = src.replace(/\.dart$/, '').replace(/[^a-zA-Z0-9]/g, '_');
            fileRenames.set(src, `${conflict.name}_${base}`);
          });
          if (fileRenames.size > 0) renameMap.set(conflict.name, fileRenames);
        });
    }

    // 1. Sort imports: dart: → package: → relative, then alphabetically
    //    Exports go after imports
    const imports = analysis.imports.filter(i => i.directive === 'import');
    const exports = analysis.imports.filter(i => i.directive === 'export');

    const sortGroup = (arr: DartImport[]) =>
      [...arr].sort((a, b) => {
        const order = { dart: 0, package: 1, relative: 2 };
        if (order[a.type] !== order[b.type]) return order[a.type] - order[b.type];
        return a.path.localeCompare(b.path);
      });

    const sortedImports = sortGroup(imports);
    const sortedExports = sortGroup(exports);

    // 2. Build header
    const timestamp = new Date().toISOString().slice(0, 19).replace('T', ' ');
    let result = `// ═══════════════════════════════════════════════════════════\n`;
    result += `// Merged by DartStreamLine  •  ${timestamp} UTC\n`;
    result += `// Files: ${files.map(f => f.name).join(', ')}\n`;
    result += `// ═══════════════════════════════════════════════════════════\n\n`;

    // 3. Write import block (grouped by type)
    let lastType = '';
    const writeImportGroup = (arr: DartImport[]) => {
      arr.forEach(imp => {
        if (lastType && lastType !== imp.type) result += '\n';
        result += `${imp.raw}\n`;
        lastType = imp.type;
      });
    };
    writeImportGroup(sortedImports);
    if (sortedExports.length > 0) {
      result += '\n';
      lastType = '';
      writeImportGroup(sortedExports);
    }
    result += '\n';

    // 4. Append file bodies with optional auto-rename
    files.forEach(file => {
      let body = this.stripDirectives(file.content).trim();

      // Auto-rename conflicting symbols in this file (LENIENT mode)
      renameMap.forEach((fileRenameMap, symbol) => {
        const newName = fileRenameMap.get(file.name);
        if (newName) {
          // Replace declaration-site: class Foo / enum Foo / etc.
          body = body.replace(
            new RegExp(`\\b(class|enum|mixin|extension|typedef|void|[A-Za-z0-9_<>?]+)\\s+${symbol}\\b`, 'g'),
            (_, kw) => `${kw} ${newName}`
          );
          // Add rename notice as inline comment above the renamed symbol
          body = body.replace(
            new RegExp(`(\\b(?:class|enum|mixin|extension|typedef)\\s+${newName}\\b)`),
            `// [DartStreamLine] Renamed from "${symbol}" to avoid collision\n$1`
          );
        }
      });

      result += `// ─── Source: ${file.name} ${'─'.repeat(Math.max(0, 48 - file.name.length))}\n`;
      result += body + '\n\n';
    });

    // 5. Normalise output
    return this.normalizeOutput(result);
  }
}
