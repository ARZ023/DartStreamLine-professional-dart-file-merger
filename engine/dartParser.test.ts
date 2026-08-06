import { describe, it, expect } from 'vitest';
import { DartParser } from './dartParser';
import { MergeMode } from '../types';

// ─── sanitizeForParsing ──────────────────────────────────────
describe('DartParser.sanitizeForParsing', () => {
  it('blanks line comments but preserves line count', () => {
    const src = `// import 'dart:async';\nclass Foo {}`;
    const out = DartParser.sanitizeForParsing(src);
    expect(out.split('\n').length).toBe(src.split('\n').length);
    expect(out).not.toContain('dart:async');
    expect(out).toContain('Foo');
  });

  it('blanks block comments and preserves newlines', () => {
    const src = `/* class Foo {} */\nclass Bar {}`;
    const out = DartParser.sanitizeForParsing(src);
    expect(out.split('\n').length).toBe(src.split('\n').length);
    expect(out).not.toContain('Foo');
    expect(out).toContain('Bar');
  });

  it('removes string contents so import-like text inside strings is ignored', () => {
    const src = `var s = "import 'dart:async';";`;
    const out = DartParser.sanitizeForParsing(src);
    expect(out).not.toContain('dart:async');
  });

  it('handles escaped quotes inside strings', () => {
    const src = `var s = "he said \\"hello\\""; class Real {}`;
    const out = DartParser.sanitizeForParsing(src);
    expect(out).toContain('Real');
  });
});

// ─── parseImports ────────────────────────────────────────────
describe('DartParser.parseImports', () => {
  it('parses a simple dart: import', () => {
    const imps = DartParser.parseImports(`import 'dart:async';`);
    expect(imps).toHaveLength(1);
    expect(imps[0]).toMatchObject({ path: 'dart:async', type: 'dart', directive: 'import' });
  });

  it('parses package: import', () => {
    const imps = DartParser.parseImports(`import 'package:flutter/material.dart';`);
    expect(imps[0].type).toBe('package');
  });

  it('parses relative import', () => {
    const imps = DartParser.parseImports(`import './utils.dart';`);
    expect(imps[0].type).toBe('relative');
  });

  it('parses import with alias', () => {
    const imps = DartParser.parseImports(`import 'package:foo/foo.dart' as foo;`);
    expect(imps[0].alias).toBe('foo');
  });

  it('parses import with show clause', () => {
    const imps = DartParser.parseImports(`import 'package:foo/foo.dart' show A, B, C;`);
    expect(imps[0].show).toEqual(['A', 'B', 'C']);
  });

  it('parses import with hide clause', () => {
    const imps = DartParser.parseImports(`import 'package:foo/foo.dart' hide X, Y;`);
    expect(imps[0].hide).toEqual(['X', 'Y']);
  });

  it('handles multi-line imports', () => {
    const src = `import 'package:foo/foo.dart'\n    show A, B;`;
    const imps = DartParser.parseImports(src);
    expect(imps).toHaveLength(1);
    expect(imps[0].show).toEqual(['A', 'B']);
  });

  it('does NOT parse import inside a line comment', () => {
    const src = `// import 'dart:io';\nimport 'dart:math';`;
    const imps = DartParser.parseImports(src);
    expect(imps).toHaveLength(1);
    expect(imps[0].path).toBe('dart:math');
  });

  it('does NOT parse import inside a string literal', () => {
    const src = `void main() { print("import 'dart:io';"); }`;
    const imps = DartParser.parseImports(src);
    expect(imps).toHaveLength(0);
  });

  it('parses export directive', () => {
    const imps = DartParser.parseImports(`export 'src/utils.dart';`);
    expect(imps[0].directive).toBe('export');
  });

  it('parses multiple imports with correct ordering', () => {
    const src = [
      `import 'dart:async';`,
      `import 'package:flutter/material.dart';`,
      `import './local.dart';`,
    ].join('\n');
    const imps = DartParser.parseImports(src);
    expect(imps.map(i => i.type)).toEqual(['dart', 'package', 'relative']);
  });
});

// ─── mergeShowClauses ────────────────────────────────────────
describe('DartParser.mergeShowClauses', () => {
  const base = { directive: 'import' as const, type: 'package' as const, path: 'package:x', raw: '' };

  it('merges show clauses of same-path imports into a union', () => {
    const merged = DartParser.mergeShowClauses([
      { ...base, show: ['A'] },
      { ...base, show: ['B'] },
    ]);
    expect(merged).toHaveLength(1);
    expect(merged[0].show).toEqual(['A', 'B']);
  });

  it('an unrestricted import beats any show-restricted import', () => {
    const merged = DartParser.mergeShowClauses([
      { ...base, show: ['A'] },
      { ...base },
    ]);
    expect(merged).toHaveLength(1);
    expect(merged[0].show).toBeUndefined();
  });

  it('keeps imports with different paths separate', () => {
    const merged = DartParser.mergeShowClauses([
      { ...base, path: 'package:a', raw: '' },
      { ...base, path: 'package:b', raw: '' },
    ]);
    expect(merged).toHaveLength(2);
  });

  it('keeps imports from different aliases separate', () => {
    const merged = DartParser.mergeShowClauses([
      { ...base, alias: 'a', show: ['A'], raw: '' },
      { ...base, alias: 'b', show: ['B'], raw: '' },
    ]);
    expect(merged).toHaveLength(2);
  });

  it('deduplicates show items', () => {
    const merged = DartParser.mergeShowClauses([
      { ...base, show: ['A', 'B'] },
      { ...base, show: ['A', 'C'] },
    ]);
    expect(merged[0].show).toEqual(['A', 'B', 'C']);
  });
});

// ─── extractDeclarations ─────────────────────────────────────
describe('DartParser.extractDeclarations', () => {
  it('extracts a class', () => {
    const d = DartParser.extractDeclarations('class MyClass {}\n', 'f.dart');
    expect(d.some(x => x.name === 'MyClass' && x.type === 'class')).toBe(true);
  });

  it('extracts an enum', () => {
    const d = DartParser.extractDeclarations('enum Color { red, green }\n', 'f.dart');
    expect(d.some(x => x.name === 'Color' && x.type === 'enum')).toBe(true);
  });

  it('extracts a mixin', () => {
    const d = DartParser.extractDeclarations('mixin Flyable {}\n', 'f.dart');
    expect(d.some(x => x.name === 'Flyable' && x.type === 'mixin')).toBe(true);
  });

  it('extracts abstract class', () => {
    const d = DartParser.extractDeclarations('abstract class Base {}\n', 'f.dart');
    expect(d.some(x => x.name === 'Base' && x.type === 'class')).toBe(true);
  });

  it('does NOT extract class declared inside a comment', () => {
    const d = DartParser.extractDeclarations('// class FakeClass {}\nclass RealClass {}\n', 'f.dart');
    expect(d.some(x => x.name === 'FakeClass')).toBe(false);
    expect(d.some(x => x.name === 'RealClass')).toBe(true);
  });

  it('captures annotations on a declaration', () => {
    const d = DartParser.extractDeclarations('@immutable\nclass MyWidget {}\n', 'f.dart');
    const cls = d.find(x => x.name === 'MyWidget');
    expect(cls?.annotations).toContain('@immutable');
  });

  it('captures multiple annotations', () => {
    const d = DartParser.extractDeclarations('@sealed\n@deprecated\nclass Old {}\n', 'f.dart');
    const cls = d.find(x => x.name === 'Old');
    expect(cls?.annotations).toEqual(expect.arrayContaining(['@sealed', '@deprecated']));
  });

  it('does NOT count a class inside a method body (depth > 0)', () => {
    const code = `class Outer {\n  void build() {\n    // class Inner\n  }\n}\n`;
    const d = DartParser.extractDeclarations(code, 'f.dart');
    expect(d.some(x => x.name === 'Inner')).toBe(false);
  });
});

// ─── analyzeFiles ────────────────────────────────────────────
describe('DartParser.analyzeFiles', () => {
  it('returns rawImportCount equal to total imports across all files', () => {
    const files = [
      { id: '1', name: 'a.dart', content: `import 'dart:async';\nimport 'dart:math';`, size: 40 },
      { id: '2', name: 'b.dart', content: `import 'dart:async';`, size: 20 },
    ];
    const r = DartParser.analyzeFiles(files);
    expect(r.rawImportCount).toBe(3);
    expect(r.imports.length).toBe(2); // deduplicated
  });

  it('detects naming conflicts and provides renamePreview', () => {
    const files = [
      { id: '1', name: 'a.dart', content: `class Helper {}\n`, size: 15 },
      { id: '2', name: 'b.dart', content: `class Helper {}\n`, size: 15 },
    ];
    const r = DartParser.analyzeFiles(files);
    const conflict = r.conflicts.find(c => c.name === 'Helper');
    expect(conflict).toBeDefined();
    expect(conflict!.severity).toBe('warning');
    expect(Object.keys(conflict!.renamePreview).length).toBeGreaterThan(0);
  });

  it('flags main() duplication as error severity', () => {
    const files = [
      { id: '1', name: 'a.dart', content: `void main() {}`, size: 15 },
      { id: '2', name: 'b.dart', content: `void main() {}`, size: 15 },
    ];
    const r = DartParser.analyzeFiles(files);
    const conflict = r.conflicts.find(c => c.name === 'main');
    expect(conflict?.severity).toBe('error');
  });

  it('parses library name', () => {
    const files = [{ id: '1', name: 'a.dart', content: `library my_lib;\nclass A {}`, size: 25 }];
    const r = DartParser.analyzeFiles(files);
    expect(r.libraryName).toBe('my_lib');
  });

  it('emits part-of warning', () => {
    const files = [{ id: '1', name: 'a.dart', content: `part of my_lib;\nclass A {}`, size: 25 }];
    const r = DartParser.analyzeFiles(files);
    expect(r.warnings.some(w => w.includes('part of'))).toBe(true);
  });
});

// ─── merge ───────────────────────────────────────────────────
describe('DartParser.merge', () => {
  it('output contains the DartStreamLine header', () => {
    const files = [{ id: '1', name: 'a.dart', content: `import 'dart:async';\nvoid main() {}`, size: 35 }];
    const analysis = DartParser.analyzeFiles(files);
    expect(DartParser.merge(files, analysis)).toContain('DartStreamLine');
  });

  it('output contains import group section labels', () => {
    const files = [{
      id: '1', name: 'a.dart',
      content: `import 'dart:async';\nimport 'package:foo/foo.dart';\nimport './local.dart';`,
      size: 70,
    }];
    const analysis = DartParser.analyzeFiles(files);
    const out = DartParser.merge(files, analysis);
    expect(out).toContain('dart: — core SDK');
    expect(out).toContain('package: — pub dependencies');
    expect(out).toContain('relative — project files');
  });

  it('auto-renames colliding symbols in LENIENT mode', () => {
    const files = [
      { id: '1', name: 'a.dart', content: `class Helper {}\n`, size: 15 },
      { id: '2', name: 'b.dart', content: `class Helper {}\n`, size: 15 },
    ];
    const analysis = DartParser.analyzeFiles(files);
    const out = DartParser.merge(files, analysis, MergeMode.LENIENT);
    expect(out).toContain('Helper_b');
    expect(out).toContain('Renamed');
  });

  it('STRICT mode output still contains both original names (no rename)', () => {
    const files = [
      { id: '1', name: 'a.dart', content: `class Widget {}\n`, size: 15 },
      { id: '2', name: 'b.dart', content: `class Widget {}\n`, size: 15 },
    ];
    const analysis = DartParser.analyzeFiles(files);
    const out = DartParser.merge(files, analysis, MergeMode.STRICT);
    expect(out).not.toContain('Widget_b');
  });

  it('normalizes output — no trailing whitespace on lines', () => {
    const files = [{ id: '1', name: 'a.dart', content: `class A {}   \n`, size: 15 }];
    const analysis = DartParser.analyzeFiles(files);
    const out = DartParser.merge(files, analysis);
    const hasTrailing = out.split('\n').some(l => l !== l.trimEnd());
    expect(hasTrailing).toBe(false);
  });

  it('emits library directive at top if present', () => {
    const files = [{ id: '1', name: 'a.dart', content: `library my_app;\nclass A {}`, size: 25 }];
    const analysis = DartParser.analyzeFiles(files);
    const out = DartParser.merge(files, analysis);
    expect(out).toContain('library my_app;');
  });
});
