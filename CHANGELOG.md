# Changelog

All notable changes to DartStreamLine will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

## [2025.12.29] — 2025-12-29

### Added
- Initial public release of DartStreamLine
- Deterministic file merger with user-defined ordering via drag-and-drop
- Smart import deduplication: combines `import`, `export`, and `part` statements, sorts by `dart:` → `package:` → relative, removes duplicates while preserving aliases
- Structural analysis: scans top-level declarations (Classes, Mixins, Enums, Extensions)
- Conflict detection: flags multiple `main()` functions and duplicate class/function names across files
- Local-first architecture: all parsing done client-side, no code leaves the browser
- Live demo hosted on GitHub Pages
- React 19 + TypeScript + Vite build system
- Modular engine in `engine/dartParser.ts`
- Reusable component architecture: `FileUpload`, `FileList`, `AnalysisPanel`, `CodePreview`

[2025.12.29]: https://github.com/ARZ023/DartStreamLine-professional-dart-file-merger/releases/tag/v2025.12.29
