import { join, resolve } from "jsr:@std/path";

const ROOT = resolve(new URL("../", import.meta.url).pathname);
const SNIPPETS_DIR = join(ROOT, "snippets");
const DIST_DIR = join(ROOT, "dist");

const RUNTIME_DIRS = ["node-legacy", "deno-2025-08-01", "python-legacy", "python-2025-08-01"];

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
  value = value.replace(/[^a-z0-9\-_\s]/g, "");
  value = value.replace(/\s+/g, "-");
  return value;
}

function extractMetaFromCode(
  code: string,
  filename: string
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
    if (commentMatch && i < 10) {
      // Only check first 10 lines for metadata
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
          tags.push(
            ...value
              .split(",")
              .map((t) => t.trim())
              .filter((t) => t)
          );
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
    cleanCode: cleanLines.join("\n"),
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

async function generateIndexHtml(): Promise<void> {
  const indexPath = join(DIST_DIR, "index.html");
  
  // Get information about all runtime directories and files
  const runtimeInfo: Array<{
    runtime: string;
    language: string;
    fileCount: number;
    files: Array<{ name: string; size: number; modified: Date }>;
  }> = [];

  for (const runtime of RUNTIME_DIRS) {
    const runtimeDir = join(DIST_DIR, runtime);
    const files: Array<{ name: string; size: number; modified: Date }> = [];
    let fileCount = 0;

    try {
      for await (const entry of Deno.readDir(runtimeDir)) {
        if (entry.isFile) {
          const filePath = join(runtimeDir, entry.name);
          const stat = await Deno.stat(filePath);
          files.push({
            name: entry.name,
            size: stat.size,
            modified: stat.mtime || new Date(),
          });
          fileCount++;
        }
      }
      files.sort((a, b) => a.name.localeCompare(b.name));
    } catch {
      // Directory doesn't exist, skip
    }

    runtimeInfo.push({
      runtime,
      language: LANGUAGE_MAP[runtime],
      fileCount,
      files,
    });
  }

  // Get JSON file info
  const jsonFiles: Array<{ name: string; size: number; modified: Date }> = [];
  for (const runtime of RUNTIME_DIRS) {
    const jsonPath = join(DIST_DIR, `${runtime}.json`);
    try {
      const stat = await Deno.stat(jsonPath);
      jsonFiles.push({
        name: `${runtime}.json`,
        size: stat.size,
        modified: stat.mtime || new Date(),
      });
    } catch {
      // File doesn't exist, skip
    }
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  const formatDate = (date: Date): string => {
    return date.toISOString().replace("T", " ").substring(0, 19) + " UTC";
  };

  const totalFiles = runtimeInfo.reduce((sum, info) => sum + info.fileCount, 0);
  const currentTime = new Date().toISOString().replace("T", " ").substring(0, 19) + " UTC";

  const html = `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Index of TagoIO Analysis Snippets</title>
    <style>
        body {
            font-family: 'Courier New', monospace;
            background-color: #f8f8f8;
            margin: 0;
            padding: 20px;
            line-height: 1.4;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background-color: white;
            border: 1px solid #ddd;
            padding: 20px;
        }
        h1 {
            font-size: 24px;
            margin-bottom: 5px;
            border-bottom: 1px solid #ddd;
            padding-bottom: 10px;
        }
        .info {
            color: #666;
            margin-bottom: 20px;
            font-size: 14px;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            font-size: 14px;
        }
        th, td {
            text-align: left;
            padding: 8px 12px;
            border-bottom: 1px solid #eee;
        }
        th {
            background-color: #f5f5f5;
            font-weight: bold;
        }
        .icon {
            width: 20px;
            text-align: center;
        }
        .name {
            min-width: 300px;
        }
        .size {
            text-align: right;
            width: 80px;
        }
        .date {
            width: 200px;
            color: #666;
        }
        a {
            color: #0066cc;
            text-decoration: none;
        }
        a:hover {
            text-decoration: underline;
        }
        .folder {
            color: #333;
            font-weight: bold;
        }
        .folder a {
            color: #333;
        }
        .description {
            color: #666;
            font-style: italic;
        }
        .section {
            margin-top: 30px;
        }
        .section h2 {
            font-size: 18px;
            color: #333;
            border-bottom: 1px solid #eee;
            padding-bottom: 5px;
        }
        .stats {
            background-color: #f9f9f9;
            padding: 15px;
            border: 1px solid #eee;
            margin-bottom: 20px;
        }
        .curl-info {
            background-color: #f0f0f0;
            padding: 15px;
            border-left: 4px solid #666;
            margin: 20px 0;
            font-family: 'Courier New', monospace;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>📁 Index of TagoIO Analysis Snippets</h1>
        
        <div class="info">
            Generated on: ${currentTime}<br>
            Repository: <a href="https://github.com/tago-io/analysis-snippets">https://github.com/tago-io/analysis-snippets</a>
        </div>

        <div class="stats">
            <strong>Repository Statistics:</strong><br>
            • Total runtime environments: ${RUNTIME_DIRS.length}<br>
            • Total snippet files: ${totalFiles}<br>
            • Languages: JavaScript (Node.js), TypeScript (Deno), Python<br>
            • API Format: JSON metadata + individual files
        </div>

        <div class="curl-info">
            <strong>💡 Terminal Usage Examples:</strong><br>
            <code>curl -s http://snippets.tago.io/deno-2025-08-01.json | jq .</code> - Get metadata<br>
            <code>curl -s http://snippets.tago.io/deno-2025-08-01/console.ts</code> - Get code file<br>
            <code>wget -r -np -R "index.html*" http://snippets.tago.io/</code> - Download all files
        </div>

        <table>
            <thead>
                <tr>
                    <th class="icon"></th>
                    <th class="name">Name</th>
                    <th class="size">Size</th>
                    <th class="date">Last Modified</th>
                    <th class="description">Description</th>
                </tr>
            </thead>
            <tbody>`;

  let tableRows = "";

  // Add parent directory link
  tableRows += `
                <tr>
                    <td class="icon">📁</td>
                    <td class="name"><a href="../">..</a></td>
                    <td class="size">-</td>
                    <td class="date">-</td>
                    <td class="description">Parent Directory</td>
                </tr>`;

  // Add JSON metadata files
  jsonFiles.sort((a, b) => a.name.localeCompare(b.name));
  for (const file of jsonFiles) {
    const runtime = file.name.replace('.json', '');
    const info = runtimeInfo.find(r => r.runtime === runtime);
    tableRows += `
                <tr>
                    <td class="icon">📄</td>
                    <td class="name"><a href="${file.name}">${file.name}</a></td>
                    <td class="size">${formatFileSize(file.size)}</td>
                    <td class="date">${formatDate(file.modified)}</td>
                    <td class="description">API metadata for ${info?.language || runtime} runtime (${info?.fileCount || 0} snippets)</td>
                </tr>`;
  }

  // Add runtime directories
  for (const info of runtimeInfo) {
    tableRows += `
                <tr class="folder">
                    <td class="icon">📁</td>
                    <td class="name"><a href="${info.runtime}/">${info.runtime}/</a></td>
                    <td class="size">-</td>
                    <td class="date">-</td>
                    <td class="description">${info.language} runtime snippets (${info.fileCount} files)</td>
                </tr>`;
  }

  const footerHtml = `
            </tbody>
        </table>

        <div class="section">
            <h2>🔍 Runtime Details</h2>
            <table>
                <thead>
                    <tr>
                        <th>Runtime</th>
                        <th>Language</th>
                        <th>Files</th>
                        <th>Features</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td><a href="node-legacy/">node-legacy/</a></td>
                        <td>JavaScript</td>
                        <td>${runtimeInfo.find(r => r.runtime === 'node-legacy')?.fileCount || 0}</td>
                        <td>Legacy Node.js runtime, pre-installed libraries only</td>
                    </tr>
                    <tr>
                        <td><a href="deno-2025-08-01/">deno-2025-08-01/</a></td>
                        <td>TypeScript</td>
                        <td>${runtimeInfo.find(r => r.runtime === 'deno-2025-08-01')?.fileCount || 0}</td>
                        <td>Modern Deno runtime, automatic dependency installation</td>
                    </tr>
                    <tr>
                        <td><a href="python-legacy/">python-legacy/</a></td>
                        <td>Python</td>
                        <td>${runtimeInfo.find(r => r.runtime === 'python-legacy')?.fileCount || 0}</td>
                        <td>Legacy Python runtime, pre-installed libraries only</td>
                    </tr>
                    <tr>
                        <td><a href="python-2025-08-01/">python-2025-08-01/</a></td>
                        <td>Python</td>
                        <td>${runtimeInfo.find(r => r.runtime === 'python-2025-08-01')?.fileCount || 0}</td>
                        <td>Modern Python runtime, UV package manager support</td>
                    </tr>
                </tbody>
            </table>
        </div>

        <div class="section">
            <h2>📖 Usage</h2>
            <p><strong>JSON API Format:</strong> Each runtime has a corresponding <code>.json</code> file containing metadata for all snippets.</p>
            <p><strong>Individual Files:</strong> Code files are served directly from runtime directories for easy access.</p>
            <p><strong>CORS Enabled:</strong> All files can be fetched from browsers and terminal tools.</p>
        </div>

        <div class="info" style="margin-top: 30px; border-top: 1px solid #eee; padding-top: 20px;">
            <small>
                📡 Auto-generated index • 
                <a href="https://github.com/tago-io/analysis-snippets">Source Code</a> • 
                <a href="https://tago.io">TagoIO Platform</a>
            </small>
        </div>
    </div>
</body>
</html>`;

  await Deno.writeTextFile(indexPath, html + tableRows + footerHtml);
  console.log("wrote dist/index.html");
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

    const relativePath = outFile.replace(`${ROOT}/`, "");
    console.log(`wrote ${relativePath} with ${payload.snippets.length} snippets`);
    console.log(`wrote dist/${runtime}/ with ${payload.snippets.length} clean files`);
  }

  // Generate the index.html file
  await generateIndexHtml();
}

if (import.meta.main) {
  main();
}
