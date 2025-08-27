#!/usr/bin/env tsx

import { promises as fs } from "node:fs";
import path from "node:path";
import {
  ANALYSIS_RUNTIMES,
  collectSnippets,
  PAYLOAD_PARSER_RUNTIMES,
  type RuntimeConfig,
  type SnippetData,
} from "../src/lib/snippets.ts";

const root = process.cwd();

type RuntimeBundle = {
  runtime: RuntimeConfig;
  snippets: SnippetData[];
};

interface StaticData {
  analysis: Record<string, RuntimeBundle>;
  payloadParser: Record<string, RuntimeBundle>;
}

async function generateStaticData() {
  const data: StaticData = {
    analysis: {},
    payloadParser: {},
  };

  for (const runtime of ANALYSIS_RUNTIMES) {
    const snippets = await collectSnippets(runtime);
    data.analysis[runtime.name] = {
      runtime,
      snippets,
    };
  }

  for (const runtime of PAYLOAD_PARSER_RUNTIMES) {
    const snippets = await collectSnippets(runtime);
    data.payloadParser[runtime.name] = {
      runtime,
      snippets,
    };
  }

  const dataPath = path.join(root, "src", "data", "snippets.json");
  await fs.mkdir(path.dirname(dataPath), { recursive: true });
  await fs.writeFile(dataPath, JSON.stringify(data, null, 2));

  console.log("✅ Generated static data file");
}

generateStaticData().catch((error) => {
  console.error("❌ Error generating static data:", error);
  process.exit(1);
});
