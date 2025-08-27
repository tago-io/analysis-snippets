import type { APIRoute } from 'astro';
// @ts-ignore
import snippetsData from '../../../data/snippets.json';

export const prerender = true;

export async function getStaticPaths() {
  const paths: { params: { runtime: string; filename: string } }[] = [];
  for (const runtime of Object.keys(snippetsData.analysis)) {
    const runtimeData = snippetsData.analysis[runtime];
    for (const snippet of runtimeData.snippets) {
      paths.push({ params: { runtime, filename: snippet.filename } });
    }
  }
  return paths;
}

export const GET: APIRoute = async ({ params }) => {
  const runtime = params.runtime!;
  const filename = params.filename!;

  const runtimeData = snippetsData.analysis[runtime as keyof typeof snippetsData.analysis];
  if (!runtimeData) return new Response('Runtime not found', { status: 404 });

  const snippet = runtimeData.snippets.find((s: any) => s.filename === filename);
  if (!snippet) return new Response('File not found', { status: 404 });

  const ext = filename.split('.').pop()?.toLowerCase();
  const map: Record<string, string> = {
    js: 'application/javascript',
    cjs: 'application/javascript',
    ts: 'text/typescript; charset=utf-8',
    tsx: 'text/typescript; charset=utf-8',
    py: 'text/x-python; charset=utf-8',
  };
  const contentType = (ext && map[ext]) || 'text/plain; charset=utf-8';

  return new Response(snippet.code, {
    headers: { 'Content-Type': contentType },
  });
};

