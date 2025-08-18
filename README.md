# TagoIO Analysis Snippets

This repository hosts code snippets for the TagoIO Analysis system. The frontend can fetch per-runtime JSON files and individual code files from GitHub Pages:

**JSON Metadata Files:**
- https://snippets.tago.io/node-legacy.json
- https://snippets.tago.io/deno-rt2025.json
- https://snippets.tago.io/python-legacy.json
- https://snippets.tago.io/python-rt2025.json

**Individual Code Files:**
- https://snippets.tago.io/node-legacy/{filename}
- https://snippets.tago.io/deno-rt2025/{filename}
- https://snippets.tago.io/python-legacy/{filename}
- https://snippets.tago.io/python-rt2025/{filename}

The JSON files contain metadata only. The actual code is served as individual files from the `{runtime}/` directories.

## Structure

- snippets/
  - node-legacy/
  - deno-rt2025/
  - python-legacy/
  - python-rt2025/
- tools/
  - generate.ts (Deno-based generator)
  - generate.py (legacy Python generator)
- dist/ (build output, generated)
  - {runtime}.json (metadata files)
  - {runtime}/ (individual code files)

Each runtime folder contains code files for that runtime with metadata embedded in comments.

## JSON schema

Each per-runtime JSON produced in `dist/` has the following shape:

```
{
  "runtime": "node-legacy",
  "schema_version": 1,
  "generated_at": "2025-08-08T00:00:00.000Z",
  "snippets": [
    {
      "id": "hello-world",
      "title": "Hello World",
      "description": "Basic hello world",
      "language": "javascript",
      "tags": ["basic"],
      "filename": "hello-world.js",
      "file_path": "node-legacy/hello-world.js"
    }
  ]
}
```

The actual code is available by fetching the individual files from `dist/{runtime}/{filename}`.

## Local generation

- Requirements: Deno 2.x
- Generate JSON files:

```
deno task generate
```

Outputs will be written to `dist/*.json` and `dist/{runtime}/`.

## GitHub Pages deployment

A GitHub Actions workflow is included to build and deploy the JSON files and code files to GitHub Pages on each push to `main`. The files will be available at `https://snippets.tago.io/node-legacy.json` and `https://snippets.tago.io/node-legacy/hello-world.js`.
