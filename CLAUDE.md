# TagoIO Analysis Snippets - Development Guide

This document provides development guidelines and automation details for the TagoIO Analysis Snippets repository.

## Project Overview

This repository contains code snippets for different TagoIO Analysis runtimes, with automated JSON generation for frontend consumption via GitHub Pages.

## TagoIO Runtime Differences

TagoIO provides multiple runtime environments for Analysis scripts, each with different capabilities and constraints:

### Node.js Legacy Runtime
- **Language**: JavaScript (ES5/ES6)
- **File Extensions**: `.js`, `.cjs`
- **Environment**: Legacy Node.js environment with limited modern features
- **Use Case**: Backward compatibility with existing analyses
- **Dependencies**: Only pre-installed libraries available in the runtime context
- **Limitations**: Older JavaScript features, limited module support, no dynamic dependency installation

### Deno 2025-08-01 Runtime
- **Language**: TypeScript/JavaScript (modern)
- **File Extensions**: `.ts`, `.tsx`, `.js`
- **Environment**: Modern Deno runtime with full TypeScript support
- **Use Case**: New analyses requiring modern JavaScript/TypeScript features
- **Dependencies**: Automatic dependency installation via Deno's built-in package manager
- **Features**: 
  - Native TypeScript support
  - Modern JavaScript APIs
  - Better security model
  - Standard library utilities
  - Dynamic imports from URL-based modules

### Python Legacy Runtime
- **Language**: Python 3.x (legacy version)
- **File Extensions**: `.py`
- **Environment**: Traditional Python runtime
- **Use Case**: Existing Python analyses
- **Dependencies**: Only pre-installed libraries available in the runtime context
- **Libraries**: Standard Python library + select scientific packages (numpy, pandas, etc.)

### Python 2025-08-01 Runtime
- **Language**: Python 3.x (modern version)
- **File Extensions**: `.py`
- **Environment**: Updated Python runtime with latest features
- **Use Case**: New Python analyses requiring modern features
- **Dependencies**: Automatic dependency installation via UV package manager
- **Features**:
  - Latest Python version
  - Enhanced standard library
  - Improved performance
  - Dynamic package installation during execution
  - Access to the full PyPI ecosystem

When creating snippets, choose the runtime that best matches your target audience's needs and the features required for the specific use case.

## Development Setup

### Prerequisites

- Deno 2.x
- Editor with EditorConfig support

### Code Style

- **Indentation**: 2 spaces (except Python: 4 spaces)
- **Line endings**: LF
- **Encoding**: UTF-8
- **Trailing whitespace**: Removed (except in Markdown)
- **Final newline**: Required

### Available Commands

```bash
# Generate JSON files from snippets
deno task generate

# Format code
deno task fmt

# Lint code
deno task lint

# Type check
deno task check
```

## Adding New Snippets

### 1. Create the Code File

Place your code file in the appropriate runtime directory:

- `snippets/node-legacy/` - JavaScript files (.js, .cjs)
- `snippets/deno-2025-08-01/` - TypeScript files (.ts, .tsx)
- `snippets/python-legacy/` - Python files (.py)
- `snippets/python-2025-08-01/` - Python files (.py)

### 2. Add Metadata via Comments

Include metadata at the top of your code file using special comments:

**JavaScript/TypeScript:**

```javascript
// @title: Your Snippet Title
// @description: Brief description of what this snippet does
// @tags: tag1, tag2, tag3

// Your code here
console.log("Hello World");
```

**Python:**

```python
# @title: Your Snippet Title  
# @description: Brief description of what this snippet does
# @tags: tag1, tag2, tag3

# Your code here
print('Hello World')
```

### 3. Generate Updated JSON

```bash
deno task generate
```

## Metadata Fields

- **@title**: Human-readable title (falls back to filename if not specified)
- **@description**: Brief description of the snippet functionality
- **@tags**: Comma-separated list of tags for categorization

## File Structure

```
snippets/
├── node-legacy/           # Node.js legacy runtime snippets
├── deno-2025-08-01/      # Deno 2025-08-01 runtime snippets  
├── python-legacy/         # Python legacy runtime snippets
└── python-2025-08-01/    # Python 2025-08-01 runtime snippets

tools/
├── generate.ts           # Deno-based JSON generator
└── generate.py          # Legacy Python generator (deprecated)

dist/                     # Generated files (auto-generated)
├── node-legacy.json      # Metadata for Node.js legacy runtime
├── deno-2025-08-01.json  # Metadata for Deno 2025-08-01 runtime
├── python-legacy.json   # Metadata for Python legacy runtime
├── python-2025-08-01.json # Metadata for Python 2025-08-01 runtime
├── node-legacy/          # Clean code files for Node.js legacy
├── deno-2025-08-01/     # Clean code files for Deno 2025-08-01
├── python-legacy/       # Clean code files for Python legacy
└── python-2025-08-01/   # Clean code files for Python 2025-08-01
```

## JSON Schema

Generated JSON files follow this structure:

```json
{
  "runtime": "deno-2025-08-01",
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
      "file_path": "deno-2025-08-01/hello-world.ts"
    }
  ]
}
```

The JSON files contain only metadata. The actual code is available as individual files in the `dist/{runtime}/` directories.

## Deployment

- **Automatic**: GitHub Actions builds and deploys to GitHub Pages on push to `main`
- **Manual**: Run `deno task generate` locally and commit the `dist/` changes

The deployment includes both JSON metadata files and individual code files in separate runtime directories.

## Best Practices

1. **Descriptive Filenames**: Use kebab-case (e.g., `data-processing.ts`)
2. **Meaningful Titles**: Write clear, concise titles for your snippets
3. **Useful Descriptions**: Explain what the snippet does and when to use it
4. **Relevant Tags**: Add tags that help with discovery and categorization
5. **Code Quality**: Follow the runtime's best practices and conventions
6. **Comments**: Include helpful inline comments in your code
7. **Dependencies**: Ensure snippets work with the target runtime's standard library
8. **SDK Types**: For Deno/TypeScript snippets, always import types from the TagoIO SDK rather than defining custom interfaces (e.g., `import type { AnalysisConstructorParams, Data } from "jsr:@tago-io/sdk"`)

## Common Tags

- `basic` - Simple, introductory examples
- `advanced` - Complex examples requiring deeper knowledge
- `api` - API interaction examples
- `data` - Data processing and manipulation
- `async` - Asynchronous programming examples
- `utility` - Utility functions and helpers
- `integration` - Integration with external services

## Troubleshooting

### Permission Errors

Ensure Deno has the required permissions:

```bash
deno run --allow-read --allow-write tools/generate.ts
```

### Formatting Issues

Run the formatter to fix style issues:

```bash
deno task fmt
```

### Linting Errors

Check for code quality issues:

```bash
deno task lint
```
