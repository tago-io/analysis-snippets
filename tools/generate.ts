import { join, resolve } from "jsr:@std/path";

const ROOT = resolve(new URL("../", import.meta.url).pathname);
const SNIPPETS_DIR = join(ROOT, "snippets");
const DIST_DIR = join(ROOT, "dist");

const RUNTIME_DIRS = [
  "node-legacy",
  "deno-2025-08-01",
  "python-legacy",
  "python-2025-08-01",
];

const LANGUAGE_MAP: Record<string, string> = {
  "node-legacy": "javascript",
  "deno-2025-08-01": "typescript",
  "python-legacy": "python",
  "python-2025-08-01": "python",
};

const SCHEMA_VERSION = 1;

interface SnippetMetadata {
  title: string;
  description: string;
  tags: string[];
}

interface Snippet {
  id: string;
  title: string;
  description: string;
  language: string;
  tags: string[];
  filename: string;
  file_path: string;
}

interface RuntimeJson {
  runtime: string;
  schema_version: number;
  generated_at: string;
  snippets: Snippet[];
}

function slugify(value: string): string {
  value = value.trim().toLowerCase();
  value = value.replace(/[^a-z0-9\-\_\s]/g, "");
  value = value.replace(/\s+/g, "-");
  return value;
}

function extractMetaFromCode(
  code: string,
  filename: string,
): { metadata: SnippetMetadata; cleanCode: string } {
  const lines = code.split("\n");
  let title = "";
  let description = "";
  const tags: string[] = [];
  const cleanLines: string[] = [];
  let foundMetadata = false;

  // Look for metadata in first few lines of comments and remove them
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmedLine = line.trim();

    // Support different comment styles for metadata
    const commentMatch = trimmedLine.match(/^(?:\/\/|#|\/\*|\*)\s*@(\w+):\s*(.+?)(?:\s*\*\/)?$/);
    if (commentMatch && i < 10) { // Only check first 10 lines for metadata
      foundMetadata = true;
      const [, key, value] = commentMatch;
      switch (key.toLowerCase()) {
        case "title":
          title = value.trim();
          break;
        case "description":
          description = value.trim();
          break;
        case "tags":
          tags.push(...value.split(",").map((t) => t.trim()).filter((t) => t));
          break;
      }
      // Skip this line in clean output
      continue;
    }

    // Skip empty lines immediately after metadata block
    if (foundMetadata && trimmedLine === "" && cleanLines.length === 0) {
      continue;
    }

    cleanLines.push(line);
    foundMetadata = false; // Stop skipping empty lines after we hit non-empty content
  }

  // Fallback to filename-based title if not specified
  if (!title) {
    const base = filename.substring(0, filename.lastIndexOf("."));
    title = base.replace(/-/g, " ").replace(/\b\w/g, (l: string) => l.toUpperCase());
  }

  return {
    metadata: { title, description, tags },
    cleanCode: cleanLines.join("\n")
  };
}

async function collectSnippets(runtime: string): Promise<Snippet[]> {
  const runtimeDir = join(SNIPPETS_DIR, runtime);
  const distRuntimeDir = join(DIST_DIR, runtime);
  const snippets: Snippet[] = [];

  try {
    await Deno.stat(runtimeDir);
  } catch {
    return snippets;
  }

  // Create runtime directory in dist
  await Deno.mkdir(distRuntimeDir, { recursive: true });

  const files: string[] = [];
  for await (const entry of Deno.readDir(runtimeDir)) {
    if (entry.isFile) {
      files.push(entry.name);
    }
  }
  files.sort();

  for (const fileName of files) {
    if (fileName === "meta.json" || fileName === "README.md") {
      continue;
    }

    const ext = fileName.substring(fileName.lastIndexOf(".")).toLowerCase();

    // Filter by runtime's language expected extensions
    if (runtime.startsWith("python") && !ext.includes(".py")) {
      continue;
    }
    if (runtime.startsWith("node") && ![".js", ".cjs"].includes(ext)) {
      continue;
    }
    if (runtime.startsWith("deno") && ![".ts", ".tsx"].includes(ext)) {
      continue;
    }

    const codePath = join(runtimeDir, fileName);
    const code = await Deno.readTextFile(codePath);
    const base = fileName.substring(0, fileName.lastIndexOf("."));
    const id = slugify(base);

    // Extract metadata from code comments and get clean code
    const { metadata, cleanCode } = extractMetaFromCode(code, fileName);
    const { title, description, tags } = metadata;

    // Write clean file to dist runtime directory
    const distFilePath = join(distRuntimeDir, fileName);
    await Deno.writeTextFile(distFilePath, cleanCode);

    snippets.push({
      id,
      title,
      description,
      language: LANGUAGE_MAP[runtime],
      tags,
      filename: fileName,
      file_path: `${runtime}/${fileName}`,
    });
  }

  return snippets;
}

function buildRuntimeJson(runtime: string): Omit<RuntimeJson, "snippets"> {
  return {
    runtime,
    schema_version: SCHEMA_VERSION,
    generated_at: new Date().toISOString(),
  };
}

async function main(): Promise<void> {
  await Deno.mkdir(DIST_DIR, { recursive: true });

  for (const runtime of RUNTIME_DIRS) {
    const payload: RuntimeJson = {
      ...buildRuntimeJson(runtime),
      snippets: await collectSnippets(runtime),
    };

    // Write JSON file
    const outFile = join(DIST_DIR, `${runtime}.json`);
    const content = JSON.stringify(payload, null, 0);
    await Deno.writeTextFile(outFile, content);

    const relativePath = outFile.replace(ROOT + "/", "");
    console.log(`wrote ${relativePath} with ${payload.snippets.length} snippets`);
    console.log(`wrote dist/${runtime}/ with ${payload.snippets.length} clean files`);
  }
}

if (import.meta.main) {
  main();
}
