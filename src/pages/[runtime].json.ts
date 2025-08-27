import type { APIRoute } from 'astro';
// @ts-ignore
import snippetsData from '../data/snippets.json';

export const prerender = true;

export async function getStaticPaths() {
  return Object.keys(snippetsData.analysis).map((runtime: string) => ({
    params: { runtime },
  }));
}

// Backward-compat endpoint for Analysis only: /{runtime}.json
export const GET: APIRoute = async ({ params }) => {
  const runtime = params.runtime!;
  const runtimeData = snippetsData.analysis[runtime as keyof typeof snippetsData.analysis];
  if (!runtimeData) {
    return new Response('Runtime not found', { status: 404 });
  }

  const metadata = runtimeData.snippets.map(({ code, ...meta }: any) => meta);

  const data = {
    runtime,
    schema_version: 1,
    generated_at: new Date().toISOString(),
    snippets: metadata,
  };

  return new Response(JSON.stringify(data), {
    headers: { 'Content-Type': 'application/json' },
  });
};

