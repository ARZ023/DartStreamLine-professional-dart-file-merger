
import { DartFile, DartImport, DartDeclaration, AnalysisResult, Conflict, MergeMode } from '../types';

/**
 * DartStreamLine Logic Engine v3.0
 *
 * Enhancement summary over v2:
 * 1. sanitizeForParsing() — strips comments & string literals before any regex pass
 * 2. Multi-line import support — [^;]* naturally spans newlines until the semicolon
 * 3. mergeShowClauses() — unions `show` clauses for same-path imports
 * 4. detectUnusedImports() — heuristic scan of combined body for each import's symbols
 * 5. parseLibraryName() — extracts library directive for output header & consolidation
 * 6. extractDeclarations() — brace-depth + annotation collection + modern Dart modifiers
 * 7. analyzeFiles() — computes renamePreview on each Conflict for UI preview
 * 8. merge() — import group section labels (dart: / package: / relative / export:)
 * 9. normalizeOutput() — strips trailing whitespace & collapses excess blank lines
 */

export class DartParser {

  // ─────────────────────────────────────────────────────────────
  // SANITIZE — strip comments & code strings (preserve newlines & directive paths)
  // ─────────────────────────────────────────────────────────────
  static stripComments(content: string): string {
    let out = content;
    // 1. Block comments — blank content, preserve newlines
    out = out.replace(/\/\*[\s\S]*?\*\//g, m => {
      const lines = m.split('\n');
      return lines.map(l => ' '.repeat(l.length)).join('\n');
    });
    // 2. Line comments
    out = out.replace(/\/\/[^\n]*/g, m => ' '.repeat(m.length));
    return out;
  }

  static sanitizeForParsing(content: string): string {
    const out = this.stripComments(content);
    // Mask string literals that do NOT follow import/export/part keywords
    return out.replace(/(?<!\b(?:import|export|part)\s+(?:r?))r?(?:"(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*')/g, '""');
  }

  // ─────────────────────────────────────────────────────────────
  // LIBRARY DIRECTIVE
  // ─────────────────────────────────────────────────────────────
  static parseLibraryName(content: string): string | undefined {
    const sanitized = this.stripComments(content);
    return /^[ \t]*library\s+([a-zA-Z0-9_.]+)\s*;/m.exec(sanitized)?.[1];
  }

  // ─────────────────────────────────────────────────────────────
  // PARSE IMPORTS & EXPORTS (multi-line aware, comment/string safe)
  // ─────────────────────────────────────────────────────────────
  static parseImports(content: string): DartImport[] {
    const sanitized = this.stripComments(content);
    const imports: DartImport[] = [];

    // [^;]* naturally spans newlines (no `s` flag needed)
    const regex = /^[ \t]*(import|export)\s+['"]([^'"]+)['"]([^;]*);/gm;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(sanitized)) !== null) {
      const directive = match[1] as 'import' | 'export';
      const path = match[2];
      const rest = match[3] ?? '';

      let type: 'dart' | 'package' | 'relative' = 'relative';
      if (path.startsWith('dart:')) type = 'dart';
      else if (path.startsWith('package:')) type = 'package';

      const asMatch = /\bas\s+(\w+)/.exec(rest);
      const showMatch = /\bshow\s+([\w\s,]+?)(?:\s+(?:hide|as)\b|$)/.exec(rest);
      const hideMatch = /\bhide\s+([\w\s,]+?)(?:\s+(?:show|as)\b|$)/.exec(rest);

      // Preserve raw text from original (not sanitized) content
      const raw = content.slice(match.index, match.index + match[0].length).trim();

      imports.push({
        raw,
        path,
        directive,
        alias: asMatch?.[1],
        show: showMatch?.[1].split(',').map(s => s.trim()).filter(Boolean),
        hide: hideMatch?.[1].split(',').map(s => s.trim()).filter(Boolean),
        type,
      });
    }
    return imports;
  }

  // ─────────────────────────────────────────────────────────────
  // PARSE PART DIRECTIVES
  // ─────────────────────────────────────────────────────────────
  static parseParts(content: string): { parts: string[]; partOfs: string[] } {
    const sanitized = this.sanitizeForParsing(content);
    const parts: string[] = [];
    const partOfs: string[] = [];
    let m: RegExpExecArray | null;

    const partRe = /^[ \t]*part\s+['"]([^'"]+)['"]\s*;/gm;
    while ((m = partRe.exec(sanitized)) !== null) parts.push(m[1]);

    const partOfRe = /^[ \t]*part\s+of\s+(?:['"]([^'"]+)['"]|([a-zA-Z0-9_.]+))\s*;/gm;
    while ((m = partOfRe.exec(sanitized)) !== null) partOfs.push(m[1] ?? m[2]);

    return { parts, partOfs };
  }

  // ─────────────────────────────────────────────────────────────
  // STRIP DIRECTIVES FROM FILE BODY
  // ─────────────────────────────────────────────────────────────
  static stripDirectives(content: string): string {
    return content
      .replace(/^[ \t]*(import|export)\s+['"][^'"]+['"][^;]*;[ \t]*$/gm, '')
      .replace(/^[ \t]*part\s+['"][^'"]+['"]\s*;[ \t]*$/gm, '')
      .replace(/^[ \t]*part\s+of\s+(?:['"][^'"]+['"]|[a-zA-Z0-9_.]+)\s*;[ \t]*$/gm, '')
      .replace(/^[ \t]*library\s+[a-zA-Z0-9_.]+\s*;[ \t]*$/gm, '');
  }

  // ─────────────────────────────────────────────────────────────
  // SHOW/HIDE UNION MERGING
  // `import 'x' show A` + `import 'x' show B` → `import 'x' show A, B`
  // If any entry is unrestricted (no show/no hide), that one wins.
  // ─────────────────────────────────────────────────────────────
  static mergeShowClauses(imports: DartImport[]): DartImport[] {
    const groups = new Map<string, DartImport[]>();
    imports.forEach(imp => {
      const key = `${imp.directive}::${imp.path}::${imp.alias ?? ''}`;
      const arr = groups.get(key) ?? [];
      arr.push(imp);
      groups.set(key, arr);
    });

    const result: DartImport[] = [];
    groups.forEach(group => {
      if (group.length === 1) { result.push(group[0]); return; }

      // Unrestricted import wins over all show/hide-restricted variants
      const unrestricted = group.find(i => !i.show && !i.hide);
      if (unrestricted) { result.push(unrestricted); return; }

      // Union all show clauses
      const allShows = new Set<string>();
      let hasShow = false;
      group.forEach(imp => { imp.show?.forEach(s => { allShows.add(s); hasShow = true; }); });

      // Intersect hide clauses (only hide something if ALL variants hide it)
      const hideSets = group.filter(i => i.hide).map(i => new Set(i.hide!));
      const mergedHide = hideSets.length > 0
        ? [...hideSets[0]].filter(h => hideSets.every(s => s.has(h))).sort()
        : undefined;

      const base = group[0];
      const showArr = hasShow ? [...allShows].sort() : undefined;

      let raw = `${base.directive} '${base.path}'`;
      if (base.alias) raw += ` as ${base.alias}`;
      if (showArr?.length) raw += ` show ${showArr.join(', ')}`;
      if (mergedHide?.length) raw += ` hide ${mergedHide.join(', ')}`;
      raw += ';';

      result.push({ ...base, raw, show: showArr, hide: mergedHide?.length ? mergedHide : undefined });
    });

    return result;
  }

  // ─────────────────────────────────────────────────────────────
  // UNUSED IMPORT DETECTION (heuristic)
  // ─────────────────────────────────────────────────────────────
  static detectUnusedImports(imports: DartImport[], files: DartFile[]): DartImport[] {
    const combinedBody = files.map(f => this.stripDirectives(f.content)).join('\n');

    return imports.filter(imp => {
      // Exports are always "used" (they re-export symbols to consumers)
      if (imp.directive === 'export') return false;
      // dart: core libs are too short/common to reliably detect
      if (imp.type === 'dart') return false;

      // If aliased, check only for the alias
      if (imp.alias) return !new RegExp(`\\b${imp.alias}\\b`).test(combinedBody);

      // If show-restricted, check if any of the shown names appear
      if (imp.show?.length) {
        return !imp.show.some(name => new RegExp(`\\b${name}\\b`).test(combinedBody));
      }

      // Heuristic for unrestricted imports: check the package/file name
      const segment = imp.path.split('/').pop()?.replace(/\.dart$/, '') ?? '';
      if (segment.length < 3) return false;
      const pascal = segment.split('_').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join('');
      return !new RegExp(`\\b${segment}\\b|\\b${pascal}\\b`).test(combinedBody);
    });
  }

  // ─────────────────────────────────────────────────────────────
  // BRACE-DEPTH DECLARATION EXTRACTOR (with annotation support)
  // ─────────────────────────────────────────────────────────────
  static extractDeclarations(content: string, sourceFile: string): DartDeclaration[] {
    const sanitized = this.sanitizeForParsing(content);
    const originalLines = content.split('\n');
    const sanitizedLines = sanitized.split('\n');
    const declarations: DartDeclaration[] = [];
    const pendingAnnotations: string[] = [];
    let depth = 0;

    const MODIFIERS = ['abstract sealed', 'abstract', 'sealed', 'base', 'interface', 'final'];
    const TYPES = ['class', 'mixin', 'enum', 'extension', 'typedef'] as const;

    for (let i = 0; i < sanitizedLines.length; i++) {
      const sLine = sanitizedLines[i];
      const oLine = originalLines[i] ?? '';
      const trimSan = sLine.trim();
      const trimOrig = oLine.trim();

      // Track brace depth change for this line
      let lineDepthDelta = 0;
      for (const ch of sLine) {
        if (ch === '{') lineDepthDelta++;
        else if (ch === '}') lineDepthDelta--;
      }

      // Collect annotations from original line (not sanitized)
      const annotMatch = /^(@[a-zA-Z_$][\w$]*(?:\s*\([^)]*\))?)/.exec(trimOrig);
      if (annotMatch) {
        pendingAnnotations.push(annotMatch[1]);
        depth += lineDepthDelta;
        continue;
      }

      // Only scan for declarations at depth 0
      if (depth === 0) {
        let matched = false;

        // Try modifier + type combos
        for (const mod of ['', ...MODIFIERS]) {
          if (matched) break;
          for (const t of TYPES) {
            const prefix = mod ? `${mod}\\s+${t}` : t;
            const re = new RegExp(`^${prefix}\\s+([a-zA-Z_$][\\w$]*)`, 'i');
            const m = re.exec(trimSan);
            if (m) {
              declarations.push({ type: t, name: m[1], content: '', sourceFile, annotations: [...pendingAnnotations] });
              pendingAnnotations.length = 0;
              matched = true;
              break;
            }
          }
        }

        if (!matched) {
          // Top-level function: ReturnType funcName(
          const funcRe = /^(?:(?:static|external)\s+)?(?:Future\??|Stream\??|void|bool|int|double|String|dynamic|[A-Z][\w$<>?,\s]*?)\s+([a-z_$][\w$]*)\s*(?:<[^>]*>)?\s*\(/;
          const fm = funcRe.exec(trimSan);
          const CONTROL = new Set(['if', 'while', 'for', 'switch', 'catch']);
          if (fm && !CONTROL.has(fm[1])) {
            declarations.push({ type: 'function', name: fm[1], content: '', sourceFile, annotations: [...pendingAnnotations] });
            pendingAnnotations.length = 0;
          } else if (trimSan && !trimSan.startsWith('@') && !trimSan.startsWith('//') && !trimSan.startsWith('/*') && trimSan !== '{' && trimSan !== '}') {
            pendingAnnotations.length = 0;
          }
        }
      } else {
        pendingAnnotations.length = 0;
      }

      depth += lineDepthDelta;
    }

    // Ensure main() captured
    if (!declarations.some(d => d.name === 'main') && /^\s*(?:void\s+)?main\s*\(/m.test(sanitized)) {
      declarations.push({ type: 'function', name: 'main', content: '', sourceFile, annotations: [] });
    }

    return declarations;
  }

  // ─────────────────────────────────────────────────────────────
  // OUTPUT NORMALIZER
  // ─────────────────────────────────────────────────────────────
  static normalizeOutput(code: string): string {
    return code
      .split('\n')
      .map(l => l.trimEnd())
      .join('\n')
      .replace(/\n{4,}/g, '\n\n\n')
      .trim() + '\n';
  }

  // ─────────────────────────────────────────────────────────────
  // ANALYSE ALL FILES
  // ─────────────────────────────────────────────────────────────
  static analyzeFiles(files: DartFile[]): AnalysisResult {
    const allImports: DartImport[] = [];
    const allDeclarations: DartDeclaration[] = [];
    const warnings: string[] = [];
    let libraryName: string | undefined;

    files.forEach(file => {
      const lib = this.parseLibraryName(file.content);
      if (lib && !libraryName) libraryName = lib;

      allImports.push(...this.parseImports(file.content));

      const { parts, partOfs } = this.parseParts(file.content);
      if (parts.length > 0)
        warnings.push(`"${file.name}" declares ${parts.length} part file(s): ${parts.map(p => `"${p}"`).join(', ')}. Include them in the merge stack for complete output.`);
      if (partOfs.length > 0)
        warnings.push(`"${file.name}" is a part-of file (part of: ${partOfs.join(', ')}). Its "part of" directive will be stripped — verify the merged output is a standalone library.`);

      allDeclarations.push(...this.extractDeclarations(this.stripDirectives(file.content), file.name));
    });

    const rawImportCount = allImports.length;

    // Dedup
    const uniqueMap = new Map<string, DartImport>();
    allImports.forEach(imp => {
      const key = `${imp.directive}::${imp.path}::${imp.alias ?? ''}::${[...(imp.show ?? [])].sort().join(',')}::${[...(imp.hide ?? [])].sort().join(',')}`;
      if (!uniqueMap.has(key)) uniqueMap.set(key, imp);
    });

    // Show/hide union merge
    const mergedImports = this.mergeShowClauses(Array.from(uniqueMap.values()));

    // Unused detection
    const unusedRaw = this.detectUnusedImports(mergedImports, files);
    const unusedPaths = new Set(unusedRaw.map(i => `${i.directive}::${i.path}`));
    const importsTagged = mergedImports.map(imp => ({
      ...imp,
      isUnused: unusedPaths.has(`${imp.directive}::${imp.path}`),
    }));
    const unusedImports = importsTagged.filter(i => i.isUnused);

    // Conflict detection + rename preview
    const nameMap = new Map<string, string[]>();
    allDeclarations.forEach(d => nameMap.set(d.name, [...(nameMap.get(d.name) ?? []), d.sourceFile]));

    const conflicts: Conflict[] = [];
    nameMap.forEach((sources, name) => {
      if (sources.length <= 1) return;
      const type = allDeclarations.find(d => d.name === name)?.type ?? 'declaration';
      const renamePreview: Record<string, string> = {};
      sources.slice(1).forEach(src => {
        const base = src.replace(/\.dart$/, '').replace(/[^a-zA-Z0-9]/g, '_');
        renamePreview[src] = `${name}_${base}`;
      });
      conflicts.push({ name, type, sources, severity: name === 'main' ? 'error' : 'warning', renamePreview });
    });

    return { imports: importsTagged, declarations: allDeclarations, conflicts, warnings, libraryName, unusedImports, rawImportCount };
  }

  // ─────────────────────────────────────────────────────────────
  // MERGE
  // ─────────────────────────────────────────────────────────────
  static merge(files: DartFile[], analysis: AnalysisResult, mode: MergeMode = MergeMode.LENIENT): string {
    // Build rename map for LENIENT mode
    const renameMap = new Map<string, Map<string, string>>();
    if (mode === MergeMode.LENIENT) {
      analysis.conflicts.filter(c => c.severity === 'warning').forEach(conflict => {
        const fileRenames = new Map<string, string>(Object.entries(conflict.renamePreview));
        if (fileRenames.size > 0) renameMap.set(conflict.name, fileRenames);
      });
    }

    const importsList = analysis.imports.filter(i => i.directive === 'import');
    const exportsList = analysis.imports.filter(i => i.directive === 'export');

    const sortByGroup = (arr: DartImport[]) =>
      [...arr].sort((a, b) => {
        const order = { dart: 0, package: 1, relative: 2 };
        return order[a.type] !== order[b.type] ? order[a.type] - order[b.type] : a.path.localeCompare(b.path);
      });

    const sortedImports = sortByGroup(importsList);
    const sortedExports = sortByGroup(exportsList);

    // Header
    const ts = new Date().toISOString().slice(0, 19).replace('T', ' ');
    let result = `// ═══════════════════════════════════════════════════════════\n`;
    result += `// Merged by DartStreamLine  •  ${ts} UTC\n`;
    result += `// Files (${files.length}): ${files.map(f => f.name).join(', ')}\n`;
    if (analysis.libraryName) result += `// Library: ${analysis.libraryName}\n`;
    result += `// ═══════════════════════════════════════════════════════════\n\n`;

    if (analysis.libraryName) result += `library ${analysis.libraryName};\n\n`;

    // Import groups with section labels
    const groups: Record<'dart' | 'package' | 'relative', DartImport[]> = { dart: [], package: [], relative: [] };
    sortedImports.forEach(imp => groups[imp.type].push(imp));

    const groupMeta: Array<{ key: 'dart' | 'package' | 'relative'; label: string }> = [
      { key: 'dart', label: 'dart: — core SDK' },
      { key: 'package', label: 'package: — pub dependencies' },
      { key: 'relative', label: 'relative — project files' },
    ];

    let hasImports = false;
    groupMeta.forEach(({ key, label }) => {
      const grp = groups[key];
      if (!grp.length) return;
      if (hasImports) result += '\n';
      result += `// ─── ${label} ${'─'.repeat(Math.max(0, 38 - label.length))}\n`;
      grp.forEach(imp => {
        result += `${imp.raw}\n`;
        if (imp.isUnused) result += `// ^ [DartStreamLine] Possibly unused — verify before removing\n`;
      });
      hasImports = true;
    });

    if (sortedExports.length > 0) {
      if (hasImports) result += '\n';
      result += `// ─── export: — re-exported symbols ${'─'.repeat(8)}\n`;
      sortedExports.forEach(exp => result += `${exp.raw}\n`);
    }

    result += '\n';

    // File bodies
    files.forEach(file => {
      let body = this.stripDirectives(file.content).trim();

      // Auto-rename conflicting symbols (LENIENT mode)
      renameMap.forEach((fileRenameMap, symbol) => {
        const newName = fileRenameMap.get(file.name);
        if (!newName) return;
        body = body.replace(
          new RegExp(`\\b((?:abstract\\s+|sealed\\s+|base\\s+|interface\\s+|final\\s+)?(?:class|enum|mixin|extension|typedef))\\s+${symbol}\\b`, 'g'),
          (_, kw) => `${kw} ${newName}`
        );
        body = body.replace(
          new RegExp(`(\\b(?:abstract\\s+|sealed\\s+|base\\s+|interface\\s+|final\\s+)?(?:class|enum|mixin|extension|typedef)\\s+${newName}\\b)`),
          `// [DartStreamLine] Renamed: "${symbol}" → "${newName}" (collision resolved)\n$1`
        );
      });

      result += `// ─── Source: ${file.name} ${'─'.repeat(Math.max(0, 44 - file.name.length))}\n`;
      result += `${body}\n\n`;
    });

    return this.normalizeOutput(result);
  }
}
