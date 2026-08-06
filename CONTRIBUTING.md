# Contributing to DartStreamLine

Thank you for your interest in DartStreamLine! Contributions of all kinds are welcome — bug fixes, new features, documentation improvements, and engine enhancements.

---

## Getting Started

### Prerequisites
- **Node.js** >= 18.0.0
- **npm** >= 9.0.0
- A code editor with TypeScript support (VS Code recommended)

### Local Setup
```bash
git clone https://github.com/ARZ023/DartStreamLine-professional-dart-file-merger.git
cd DartStreamLine-professional-dart-file-merger
npm install
npm run dev
```
The dev server will start at `http://localhost:5173`.

---

## How to Contribute

### 🐛 Reporting Bugs
1. Search [existing issues](https://github.com/ARZ023/DartStreamLine-professional-dart-file-merger/issues) to avoid duplicates.
2. Open a new issue using the **Bug Report** template.
3. Include: your OS, browser version, the `.dart` files causing the issue (if shareable), and the expected vs. actual output.

### 💡 Proposing Features
1. Open an issue using the **Feature Request** template.
2. Describe the problem you're solving and why it matters to Flutter/Dart developers.
3. If proposing a change to the merge algorithm, include before/after `.dart` examples.

### 📦 Submitting a Pull Request
1. Fork the repository and create your branch from `main`:
   ```bash
   git checkout -b feat/your-feature-name
   ```
2. Make your changes with clear, focused commits.
3. Ensure the project builds without errors:
   ```bash
   npm run build
   ```
4. Open a Pull Request and fill in the PR template.

---

## Project Structure

```
DartStreamLine/
├── App.tsx                  # Root React application component
├── index.tsx                # React entry point
├── types.ts                 # Shared TypeScript type definitions
├── engine/
│   └── dartParser.ts        # Core merge algorithm & structural analyser
├── components/
│   ├── FileUpload.tsx        # Drag-and-drop file ingestion
│   ├── FileList.tsx          # Ordered file list with reordering
│   ├── AnalysisPanel.tsx     # Conflict detection & structural summary
│   ├── CodePreview.tsx       # Merged output preview & download
│   ├── Header.tsx            # App header
│   ├── Footer.tsx            # App footer
│   └── Logo.tsx              # Brand logo component
├── public/
│   ├── robots.txt
│   └── sitemap.xml
└── .github/
    └── workflows/
        ├── deploy.yml        # GitHub Pages deployment
        └── ci.yml            # Build & lint validation on PRs
```

### Key File: `engine/dartParser.ts`
This is the heart of DartStreamLine. It contains:
- **Import extraction**: Strips and collects all `import`/`export`/`part` directives.
- **Deduplication logic**: Compares paths, aliases, and show/hide clauses.
- **Sorting**: Groups by `dart:` → `package:` → relative, then alphabetically.
- **Collision detection**: Scans top-level declarations for naming conflicts.
- **Assembly**: Produces the final merged `.dart` file with structural comments.

If you are modifying the merge algorithm, please add inline comments explaining the invariant your change preserves.

---

## Style Guide

- **TypeScript**: Strict mode is enabled. No `any` types unless absolutely necessary and commented.
- **React**: Functional components only. No class components.
- **Naming**: PascalCase for components and types, camelCase for functions and variables.
- **Comments**: Explain *why*, not *what*.

---

## Pull Request Checklist

Before submitting:
- [ ] `npm run build` completes without errors
- [ ] No TypeScript type errors (`npx tsc --noEmit`)
- [ ] Changes are scoped to a single concern
- [ ] CHANGELOG.md updated under `[Unreleased]`
- [ ] If modifying `dartParser.ts`: edge cases documented with comments
