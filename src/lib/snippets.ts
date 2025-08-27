import { promises as fs } from "node:fs";
import path from "node:path";

const root = process.cwd();

export interface SnippetData {
  id: string;
  title: string;
  description: string;
  language: string;
  tags: string[];
  filename: string;
  file_path: string;
  code: string;
}

export interface RuntimeConfig {
  name: string;
  displayName: string;
  language: string;
  exts: string[];
  sourceDir: string;
}

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\- _\s]/g, "")
    .replace(/\s+/g, "-");
}

function parseMetaFromLines(lines: string[]): {
  title: string;
  description: string;
  tags: string[];
} {
  let title = "";
  let description = "";
  const tags: string[] = [];

  for (const raw of lines) {
    const line = raw.trim();
    const m = line.match(/^(?:\/\/|#|--|\/\*|\*)\s*@(\w+):\s*(.+?)(?:\s*\*\/)?$/);
    if (!m) continue;

    const [, key, val] = m;
    if (key.toLowerCase() === "title") title = val.trim();
    if (key.toLowerCase() === "description") description = val.trim();
    if (key.toLowerCase() === "tags") {
      tags.push(
        ...val
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
      );
    }
  }

  return { title, description, tags };
}

function stripMetaHeader(content: string): string {
  const lines = content.split(/\r?\n/);
  let i = 0;
  let sawMeta = false;
  const metaKeyRe = /^(?:\/\/|#|--|\*|\/\*)\s*@(?:title|description|tags):/i;

  while (i < lines.length) {
    const t = lines[i].trim();
    if (metaKeyRe.test(t)) {
      sawMeta = true;
      i++;
      continue;
    }
    if (sawMeta) {
      if (t === "") {
        i++;
        continue;
      }
      if (/^\*\/?\s*$/.test(t)) {
        i++;
        continue;
      }
    }
    break;
  }

  return lines.slice(i).join("\n");
}

async function readFirstLines(filePath: string, n = 10): Promise<string[]> {
  const content = await fs.readFile(filePath, "utf8");
  return content.split("\n").slice(0, n);
}

export async function collectSnippets(runtime: RuntimeConfig): Promise<SnippetData[]> {
  const dir = path.join(root, runtime.sourceDir, runtime.name);
  let entries = [];

  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return [];
  }

  const files = entries
    .filter((d) => d.isFile())
    .map((d) => d.name)
    .filter((file) => {
      if (["README.md", "meta.json"].includes(file)) return false;
      const ext = path.extname(file).toLowerCase();
      return runtime.exts.includes(ext);
    })
    .sort();

  const snippets: SnippetData[] = [];

  for (const file of files) {
    const filePath = path.join(dir, file);
    const codeRaw = await fs.readFile(filePath, "utf8");
    const code = stripMetaHeader(codeRaw);
    const lines = await readFirstLines(filePath);
    const meta = parseMetaFromLines(lines);
    const base = file.slice(0, file.lastIndexOf("."));
    const id = slugify(base);
    const title = meta.title || base.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());

    snippets.push({
      id,
      title,
      description: meta.description,
      language: runtime.language,
      tags: meta.tags,
      filename: file,
      file_path: `${runtime.name}/${file}`,
      code,
    });
  }

  return snippets;
}

export const ANALYSIS_RUNTIMES: RuntimeConfig[] = [
  {
    name: "node-legacy",
    displayName: "Node.js Legacy",
    language: "javascript",
    exts: [".js", ".cjs"],
    sourceDir: "snippets/analysis",
  },
  {
    name: "node-rt2025",
    displayName: "Node.js rt2025",
    language: "javascript",
    exts: [".js"],
    sourceDir: "snippets/analysis",
  },
  {
    name: "deno-rt2025",
    displayName: "Deno rt2025",
    language: "typescript",
    exts: [".ts", ".tsx"],
    sourceDir: "snippets/analysis",
  },
  {
    name: "python-legacy",
    displayName: "Python Legacy",
    language: "python",
    exts: [".py"],
    sourceDir: "snippets/analysis",
  },
  {
    name: "python-rt2025",
    displayName: "Python rt2025",
    language: "python",
    exts: [".py"],
    sourceDir: "snippets/analysis",
  },
];

export const PAYLOAD_PARSER_RUNTIMES: RuntimeConfig[] = [
  {
    name: "javascript",
    displayName: "JavaScript",
    language: "javascript",
    exts: [".js"],
    sourceDir: "snippets/payload-parser",
  },
];
