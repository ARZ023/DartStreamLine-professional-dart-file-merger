
export interface DartFile {
  id: string;
  name: string;
  content: string;
  size: number;
}

export interface DartImport {
  raw: string;
  path: string;
  alias?: string;
  show?: string[];
  hide?: string[];
  type: 'dart' | 'package' | 'relative';
}

export interface DartDeclaration {
  type: 'class' | 'enum' | 'mixin' | 'extension' | 'function' | 'typedef' | 'other';
  name: string;
  content: string;
  sourceFile: string;
}

export interface AnalysisResult {
  imports: DartImport[];
  declarations: DartDeclaration[];
  conflicts: Conflict[];
  warnings: string[];
}

export interface Conflict {
  name: string;
  type: string;
  sources: string[];
  severity: 'error' | 'warning';
}

export enum MergeMode {
  STRICT = 'STRICT',
  LENIENT = 'LENIENT'
}
