
import { DartFile, DartImport, DartDeclaration, AnalysisResult, Conflict } from '../types';

/**
 * DartStreamline Logic Engine
 * 
 * This engine handles the structural analysis of Dart files.
 * It identifies imports, exports, and top-level declarations using
 * structural regex and block-matching to simulate AST-like behavior
 * without requiring a full WASM Dart Analyzer.
 */

export class DartParser {
  private static IMPORT_REGEX = /import\s+['"]([^'"]+)['"](?:\s+as\s+([a-zA-Z0-9_$]+))?(?:\s+show\s+([^;]+))?(?:\s+hide\s+([^;]+))?\s*;/g;
  private static DECL_REGEX = /^(class|enum|mixin|extension|typedef|void|[a-zA-Z0-9_$<>?]+\s+)\s*([a-zA-Z0-9_$]+)[\s\S]*?(?={|\s*;)/gm;

  static parseImports(content: string): DartImport[] {
    const imports: DartImport[] = [];
    let match;
    while ((match = this.IMPORT_REGEX.exec(content)) !== null) {
      const path = match[1];
      let type: 'dart' | 'package' | 'relative' = 'relative';
      if (path.startsWith('dart:')) type = 'dart';
      else if (path.startsWith('package:')) type = 'package';

      imports.push({
        raw: match[0],
        path,
        alias: match[2],
        show: match[3]?.split(',').map(s => s.trim()),
        hide: match[4]?.split(',').map(s => s.trim()),
        type
      });
    }
    return imports;
  }

  static analyzeFiles(files: DartFile[]): AnalysisResult {
    const allImports: DartImport[] = [];
    const allDeclarations: DartDeclaration[] = [];
    const warnings: string[] = [];

    files.forEach(file => {
      // Parse Imports
      const imports = this.parseImports(file.content);
      allImports.push(...imports);

      // Extract Declarations (Naive block extractor)
      // Note: In a real prod tool, we'd use a more robust curly-brace counting parser.
      const cleaned = file.content.replace(this.IMPORT_REGEX, '');
      
      // Look for top-level structures
      const topLevelTypes = ['class', 'enum', 'mixin', 'extension', 'typedef'];
      topLevelTypes.forEach(type => {
        const regex = new RegExp(`^${type}\\s+([a-zA-Z0-9_$]+)`, 'gm');
        let m;
        while ((m = regex.exec(cleaned)) !== null) {
          allDeclarations.push({
            type: type as any,
            name: m[1],
            content: '', // Content extraction requires sophisticated balancing
            sourceFile: file.name
          });
        }
      });

      // Special check for main()
      if (cleaned.includes('void main(') || cleaned.includes('main(')) {
        allDeclarations.push({
          type: 'function',
          name: 'main',
          content: '',
          sourceFile: file.name
        });
      }
    });

    // Detect Conflicts
    const conflicts: Conflict[] = [];
    const nameMap = new Map<string, string[]>();

    allDeclarations.forEach(d => {
      const existing = nameMap.get(d.name) || [];
      nameMap.set(d.name, [...existing, d.sourceFile]);
    });

    nameMap.forEach((sources, name) => {
      if (sources.length > 1) {
        const type = allDeclarations.find(d => d.name === name)?.type || 'declaration';
        conflicts.push({
          name,
          type,
          sources,
          severity: name === 'main' ? 'error' : 'warning'
        });
      }
    });

    // Deduplicate Imports
    const uniqueImportsMap = new Map<string, DartImport>();
    allImports.forEach(imp => {
      const key = `${imp.path}-${imp.alias || ''}-${imp.show?.join(',') || ''}-${imp.hide?.join(',') || ''}`;
      if (!uniqueImportsMap.has(key)) {
        uniqueImportsMap.set(key, imp);
      }
    });

    return {
      imports: Array.from(uniqueImportsMap.values()),
      declarations: allDeclarations,
      conflicts,
      warnings
    };
  }

  static merge(files: DartFile[], analysis: AnalysisResult): string {
    // 1. Sort Imports
    const sortedImports = [...analysis.imports].sort((a, b) => {
      const order = { dart: 0, package: 1, relative: 2 };
      if (order[a.type] !== order[b.type]) return order[a.type] - order[b.type];
      return a.path.localeCompare(b.path);
    });

    // 2. Generate Result
    let result = '// Merged via DartStreamline\n\n';
    
    // Add Sorted Imports
    let lastType = '';
    sortedImports.forEach(imp => {
      if (lastType && lastType !== imp.type) result += '\n';
      result += `${imp.raw}\n`;
      lastType = imp.type;
    });

    result += '\n';

    // Add Code Content (stripping existing imports)
    files.forEach(file => {
      result += `// --- Source: ${file.name} ---\n`;
      const contentWithoutImports = file.content
        .replace(this.IMPORT_REGEX, '')
        .trim();
      result += contentWithoutImports + '\n\n';
    });

    return result;
  }
}
