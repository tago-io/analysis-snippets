# TagoIO Snippets

This repository hosts code snippets for TagoIO, combining both Analysis and Payload Parser snippets in a single project and website. The site is built with Astro and styled with a shadcn-inspired Tailwind theme.

## Public URLs

- Analysis JSON: https://snippets.tago.io/analysis/{runtime}.json (e.g., deno-rt2025.json)
- Analysis files: https://snippets.tago.io/analysis/{runtime}/{filename}
- Payload Parser JSON: https://snippets.tago.io/payload-parser/{runtime}.json (javascript)
- Payload Parser files: https://snippets.tago.io/payload-parser/{runtime}/{filename}

The JSON files contain metadata only. The code is served as individual files from their runtime directories.

## Structure

- snippets/
  - analysis/
    - node-legacy/
    - node-rt2025/
    - deno-rt2025/
    - python-legacy/
    - python-rt2025/
  - payload-parser/
    - javascript/
- scripts/
  - prepare-snippets.mjs (build pre-step that generates JSON and exposes files)
- src/ (Astro site)
- public/ (static files; JSON and code are generated into here)
- dist/ (Astro build output)

Each runtime folder contains code files with metadata embedded in comments.

## JSON schema

Each per-runtime JSON produced in `public/{category}/` has the following shape:

```
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

## Local development / build

- Requirements: Node.js 18+ (or 22 LTS)
- Install deps: `npm install`
- Dev server: `npm run dev`
- Build site: `npm run build`

The build will:
- Collect snippet metadata and write JSON + code files to `public/analysis/` and `public/payload-parser/`
- Also write backward-compatible Analysis JSON/files to `public/{runtime}.json` and `public/{runtime}/`
- Build the Astro site into `dist/`

## GitHub Pages deployment

A GitHub Actions workflow builds the Astro site (including JSON and files) and deploys `dist/` to GitHub Pages on each push to `main`. The site includes friendly pages, while JSON and code files are served directly from the built output. Legacy Analysis endpoints remain functional.
