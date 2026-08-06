<div align="center">
  <img src="./banner.png" alt="DartStreamline Banner" width="100%"/>
</div>

<div align="center">

[![Live Demo](https://img.shields.io/badge/🚀_Live_Demo-View_Site-blue?style=for-the-badge)](https://arz023.github.io/DartStreamLine-professional-dart-file-merger/)
[![Version](https://img.shields.io/badge/version-v2025.12.29-violet?style=for-the-badge)](CHANGELOG.md)
[![License](https://img.shields.io/badge/license-MIT-green?style=for-the-badge)](LICENSE)
[![CI](https://img.shields.io/github/actions/workflow/status/ARZ023/DartStreamLine-professional-dart-file-merger/ci.yml?branch=main&label=CI&style=for-the-badge)](https://github.com/ARZ023/DartStreamLine-professional-dart-file-merger/actions)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178c6?style=for-the-badge&logo=typescript&logoColor=white)](tsconfig.json)
[![React](https://img.shields.io/badge/React-19-61dafb?style=for-the-badge&logo=react&logoColor=black)](package.json)

</div>

---

# DartStreamLine — Professional Dart File Merger

> A high-performance, **browser-native** tool for Flutter and Dart developers who need to consolidate multiple `.dart` source files into a single, valid, and optimized output — with zero server contact, zero data leakage.

---

## ✨ Key Features

| Feature | Description |
|---|---|
| 🔀 **Deterministic Merge** | Maintains your exact user-defined file order via drag-and-drop reordering |
| 📦 **Smart Import Deduplication** | Collects all `import`, `export`, and `part` directives, deduplicates by path + alias + show/hide clauses, then sorts: `dart:` → `package:` → relative |
| 🔬 **Structural Analysis** | Scans every file for top-level declarations: Classes, Mixins, Enums, Extensions, and Functions |
| ⚠️ **Conflict Detection** | Flags multiple `main()` functions, duplicate class names, and duplicate top-level symbol names across all input files |
| 🔒 **Local-First** | All parsing runs client-side in your browser. Your code **never leaves your machine** |
| ⚡ **No Install** | Runs instantly from the [live demo](https://arz023.github.io/DartStreamLine-professional-dart-file-merger/) — no npm, no Dart SDK required |

---

## 🚀 Quick Start

### Option A — Use the Live Demo (No Setup)
👉 **[arz023.github.io/DartStreamLine-professional-dart-file-merger](https://arz023.github.io/DartStreamLine-professional-dart-file-merger/)**

1. Drag and drop your `.dart` files onto the upload zone.
2. Reorder files using the drag handles in the file list.
3. Review the structural analysis for conflicts.
4. Click **Download Merged File** to save the result.

### Option B — Run Locally
```bash
# Prerequisites: Node.js >= 18
git clone https://github.com/ARZ023/DartStreamLine-professional-dart-file-merger.git
cd DartStreamLine-professional-dart-file-merger
npm install
npm run dev
# Open http://localhost:5173
```

---

## 🏗️ Architecture

```
DartStreamLine/
├── engine/
│   └── dartParser.ts        ← Core merge algorithm (import extraction, dedup, sort, assembly)
├── components/
│   ├── FileUpload.tsx        ← Drag-and-drop file ingestion
│   ├── FileList.tsx          ← Ordered file list with drag reordering
│   ├── AnalysisPanel.tsx     ← Conflict detection & structural summary panel
│   ├── CodePreview.tsx       ← Merged output with syntax highlight & download
│   ├── Header.tsx / Footer.tsx / Logo.tsx
├── App.tsx                  ← Root component & state orchestration
├── types.ts                 ← Shared TypeScript interfaces
└── vite.config.ts           ← Vite build configuration
```

### Merge Algorithm (5 Stages)

```
Input Files
    │
    ▼
1. EXTRACTION ─── Strip import blocks from each file body
    │
    ▼
2. ANALYSIS ────── Collect all imports into a global registry
    │              Scan top-level declarations per file
    ▼
3. DEDUPLICATION ─ Compare (path + alias + show/hide) tuples → flatten
    │
    ▼
4. SORTING ──────── dart: → package: → relative, then alphabetically
    │
    ▼
5. ASSEMBLY ─────── Header comment → unified imports → file bodies (in user order)
    │
    ▼
Merged .dart Output
```

---

## ⚠️ Known Limitations

| Limitation | Detail |
|---|---|
| **No auto-format** | Output preserves original indentation. Run `dart format` on the result for style consistency. |
| **Logic conflicts** | Naming collisions are *detected* but not automatically resolved — manual review required. |
| **`part` directives** | `part` statements are collected and included, but merging `part of` files manually through the tool gives the best results. |
| **No semantic analysis** | The engine uses structural (text-level) parsing, not a full Dart AST. Complex metaprogramming scenarios may produce unexpected results. |

---

## 🤝 Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) before submitting a PR.

- 🐛 [Report a bug](.github/ISSUE_TEMPLATE/bug_report.md)
- 💡 [Request a feature](.github/ISSUE_TEMPLATE/feature_request.md)
- 📖 [Read the contributing guide](CONTRIBUTING.md)

---

## 📋 Changelog

See [CHANGELOG.md](CHANGELOG.md) for a full version history.

---

## 🔒 Security

DartStreamLine is fully client-side — no data ever leaves your browser. For security vulnerability reports, see [SECURITY.md](SECURITY.md).

---

## 📄 License

Distributed under the MIT License. See [LICENSE](LICENSE) for details.
