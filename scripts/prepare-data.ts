#!/usr/bin/env tsx

import { promises as fs } from "fs";
import path from "path";
import { collectSnippets, ANALYSIS_RUNTIMES, PAYLOAD_PARSER_RUNTIMES } from "../src/lib/snippets.ts";

const root = process.cwd();

async function generateStaticData() {
  const data = {
    analysis: {},
    payloadParser: {},
  };

  // Collect analysis snippets
  for (const runtime of ANALYSIS_RUNTIMES) {
    const snippets = await collectSnippets(runtime);
    data.analysis[runtime.name] = {
      runtime: runtime,
      snippets: snippets,
    };
  }

  // Collect payload parser snippets
  for (const runtime of PAYLOAD_PARSER_RUNTIMES) {
    const snippets = await collectSnippets(runtime);
    data.payloadParser[runtime.name] = {
      runtime: runtime,
      snippets: snippets,
    };
  }

  // Write the data file
  const dataPath = path.join(root, "src", "data", "snippets.json");
  await fs.mkdir(path.dirname(dataPath), { recursive: true });
  await fs.writeFile(dataPath, JSON.stringify(data, null, 2));

  console.log("✅ Generated static data file");
}

generateStaticData().catch((error) => {
  console.error("❌ Error generating static data:", error);
  process.exit(1);
});