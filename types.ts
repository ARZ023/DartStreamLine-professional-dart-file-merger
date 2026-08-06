
export interface DartFile {
  id: string;
  name: string;
  content: string;
  size: number;
}

export interface DartImport {
  raw: string;
  path: string;
  /** Whether this is an `import` or `export` directive */
  directive: 'import' | 'export';
  alias?: string;
  show?: string[];
  hide?: string[];
  type: 'dart' | 'package' | 'relative';
  /** Flagged true if this import appears unreferenced in any merged file body */
  isUnused?: boolean;
}

export interface DartDeclaration {
  type: 'class' | 'enum' | 'mixin' | 'extension' | 'function' | 'typedef' | 'other';
  name: string;
  content: string;
  sourceFile: string;
  /** Annotations found immediately before this declaration, e.g. ['@immutable', '@override'] */
  annotations: string[];
}

export interface MergeStats {
  totalInputFiles: number;
  totalInputLines: number;
  totalInputBytes: number;
  outputLines: number;
  outputBytes: number;
  importsDeduped: number;
  unusedImports: number;
  conflictsAutoResolved: number;
}

export interface AnalysisResult {
  imports: DartImport[];
  declarations: DartDeclaration[];
  conflicts: Conflict[];
  warnings: string[];
  /** First `library` directive name found across all files, if any */
  libraryName?: string;
  /** Imports that appear to be unreferenced in the merged body */
  unusedImports: DartImport[];
  /** Raw import count before deduplication (used for stats) */
  rawImportCount: number;
}

export interface Conflict {
  name: string;
  type: string;
  sources: string[];
  severity: 'error' | 'warning';
  /** LENIENT-mode rename preview: sourceFile → newSymbolName */
  renamePreview: Record<string, string>;
}

export enum MergeMode {
  STRICT = 'STRICT',
  LENIENT = 'LENIENT'
}
