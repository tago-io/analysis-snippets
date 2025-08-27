# TagoIO Snippets - Development Guide

This document provides development guidelines and automation details for the unified TagoIO Snippets repository.

## Project Overview

This repository contains code snippets for TagoIO, covering two categories:
- Analysis snippets (multiple runtimes)
- Payload Parser snippets (JavaScript)

Outputs are exposed as JSON metadata and file endpoints via the Astro site and deployed to GitHub Pages at snippets.tago.io.

## Analysis Runtimes

TagoIO provides multiple runtime environments for Analysis scripts:

### Node.js Legacy Runtime
- Language: JavaScript (ES5/ES6)
- File Extensions: .js, .cjs
- Environment: Legacy Node.js environment with limited modern features
- Dependencies: Only pre-installed libraries available

### Node.js rt2025 Runtime
- Language: JavaScript (modern)
- File Extensions: .js
- Environment: Modern Node.js runtime with fetch API support

### Deno rt2025 Runtime
- Language: TypeScript/JavaScript (modern)
- File Extensions: .ts, .tsx, .js
- Environment: Modern Deno runtime with full TypeScript support
- Features: Native TS, modern APIs, URL-based modules

### Python Legacy Runtime
- Language: Python 3.x (legacy)
- File Extensions: .py
- Dependencies: Pre-installed libraries only

### Python rt2025 Runtime
- Language: Python 3.x (modern)
- File Extensions: .py
- Features: Latest Python, improved performance, dynamic package installation (UV), access to PyPI

When creating analysis snippets, choose the runtime that best matches your audience and feature needs.

## Payload Parser Runtimes

### JavaScript Runtime
- Language: JavaScript (ES5/ES6+)
- File Extensions: .js
- Environment: Node.js-based runtime
- Use Case: Processing and transforming device payload data


## Development Setup

### Prerequisites
- Node.js 18+ (or 22 LTS)
- Biome 2.x (for JS/TS formatting and linting)
- Ruff 0.12+ (for Python formatting and linting)
- Editor with EditorConfig support

### Code Style

JavaScript/TypeScript (Biome):
- Indentation: 2 spaces
- Line width: 100
- Quotes: Double
- Semicolons: Always
- Trailing commas: ES5 style

Python (Ruff):
- Indentation: 4 spaces
- Line width: 88 (Black compatible)
- Quotes: Double
- Import sorting: Enabled

Common:
- Line endings: LF
- Encoding: UTF-8
- Trailing whitespace: Removed (except in Markdown)
- Final newline: Required

## Available Commands

```bash
# Start dev server (Astro)
npm run dev

# Build JSON data and static site
npm run build

# Preview built site locally
npm run preview

# Format all code (JS/TS with Biome, Python with Ruff)
npm run fmt
# JS/TS only
npm run fmt:js
# Python only
npm run fmt:py

# Lint all code (JS/TS with Biome, Python with Ruff)
npm run lint
# JS/TS only
npm run lint:js
# Python only
npm run lint:py
# Lint and auto-fix issues
npm run lint:fix
```

## Adding New Snippets

1) Create the code file in the appropriate directory.

Analysis:
- snippets/analysis/node-legacy/ (.js, .cjs)
- snippets/analysis/node-rt2025/ (.js)
- snippets/analysis/deno-rt2025/ (.ts, .tsx)
- snippets/analysis/python-legacy/ (.py)
- snippets/analysis/python-rt2025/ (.py)

Payload Parser:
- snippets/payload-parser/javascript/ (.js)

2) Add metadata via comments at the top of your code file.

JavaScript/TypeScript:
```javascript
// @title: Your Snippet Title
// @description: Brief description of what this snippet does
// @tags: tag1, tag2, tag3
```

Python:
```python
# @title: Your Snippet Title
# @description: Brief description of what this snippet does
# @tags: tag1, tag2, tag3
```


3) Generate updated JSON and files
```bash
npm run build
```

## Metadata Fields
- @title: Human-readable title (falls back to filename)
- @description: Brief description
- @tags: Comma-separated list of tags

## File Structure

```
snippets/
├── analysis/
│  ├── node-legacy/
│  ├── node-rt2025/
│  ├── deno-rt2025/
│  ├── python-legacy/
│  └── python-rt2025/
└── payload-parser/
   └── javascript/

scripts/
└── prepare-data.ts       # Node/TS script to generate src/data/snippets.json

src/
├── data/snippets.json    # Generated at build/start
└── pages/
   ├── analysis/[runtime].json.(ts|js)
   ├── analysis/[runtime]/[filename].(ts|js)
   ├── payload-parser/[runtime].json.ts
   └── payload-parser/[runtime]/[filename].ts

dist/                     # Astro build output
└── … static site + prerendered API endpoints
```

## JSON Schema

Generated JSON files follow this structure:

```json
{
  "runtime": "deno-rt2025",
  "schema_version": 1,
  "generated_at": "2025-08-08T00:00:00.000Z",
  "snippets": [
    {
      "id": "hello-world",
      "title": "Hello World",
      "description": "Basic hello world example",
      "language": "typescript",
      "tags": ["basic", "deno"],
      "filename": "hello-world.ts",
      "file_path": "deno-rt2025/hello-world.ts"
    }
  ]
}
```

The JSON files contain only metadata. The actual code is available as individual files in the corresponding dist directories.

## Public URLs

New category-based endpoints (preferred):
- Analysis JSON: https://snippets.tago.io/analysis/{runtime}.json
- Analysis files: https://snippets.tago.io/analysis/{runtime}/{filename}
- Payload Parser JSON: https://snippets.tago.io/payload-parser/{runtime}.json
- Payload Parser files: https://snippets.tago.io/payload-parser/{runtime}/{filename}

Backward compatibility (Analysis only):
- JSON: https://snippets.tago.io/{runtime}.json
- Files: https://snippets.tago.io/{runtime}/{filename}

Note: The HTML pages and README do not mention legacy endpoints. They exist only to avoid breaking changes and may be removed in the future.

## Deployment

- Automatic: GitHub Actions builds and deploys the Astro site to GitHub Pages on push to main
- Manual: Run `npm run build` locally and deploy the `dist/` output

## Best Practices
1. Descriptive Filenames: Use kebab-case (e.g., data-processing.ts)
2. Meaningful Titles: Clear, concise titles
3. Useful Descriptions: Explain what the snippet does and when to use it
4. Relevant Tags: Aid discovery and categorization
5. Code Quality: Follow the runtime's best practices
6. Comments: Include helpful inline comments
7. Dependencies: Ensure snippets work with the target runtime's standard library
8. SDK Types: For Deno/TypeScript analyses, import types from the TagoIO SDK (e.g., `import type { AnalysisConstructorParams, Data } from "npm:@tago-io/sdk"`)

## Troubleshooting

Regenerate data file only:
```bash
node --loader tsx ./scripts/prepare-data.ts
```

Formatting issues:
```bash
# Format all files
npm run fmt
# JS/TS only
npm run fmt:js
# Python only
npm run fmt:py
```

Linting issues:
```bash
# Lint all
npm run lint
# Auto-fix
npm run lint:fix
```

Tool installation:
```bash
# Install Biome
yarn global add @biomejs/biome || npm i -g @biomejs/biome
# Install Ruff (macOS/Linux)
curl -LsSf https://astral.sh/ruff/install.sh | sh
# Install Ruff (Windows)
powershell -c "irm https://astral.sh/ruff/install.ps1 | iex"
```
