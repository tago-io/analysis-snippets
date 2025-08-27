import type { APIRoute } from 'astro';
// @ts-ignore
import snippetsData from '../../../data/snippets.json';

export const prerender = true;

export async function getStaticPaths() {
  const paths: { params: { runtime: string; filename: string } }[] = [];
  for (const runtime of Object.keys(snippetsData.payloadParser)) {
    const runtimeData = snippetsData.payloadParser[runtime];
    for (const snippet of runtimeData.snippets) {
      paths.push({ params: { runtime, filename: snippet.filename } });
    }
  }
  return paths;
}

export const GET: APIRoute = async ({ params }) => {
  const runtime = params.runtime!;
  const filename = params.filename!;

  const runtimeData = snippetsData.payloadParser[runtime as keyof typeof snippetsData.payloadParser];
  if (!runtimeData) return new Response('Runtime not found', { status: 404 });

  const snippet = runtimeData.snippets.find((s: any) => s.filename === filename);
  if (!snippet) return new Response('File not found', { status: 404 });

  // Simple content type inference
  const ext = filename.split('.').pop()?.toLowerCase();
  const contentType = ext === 'js' ? 'application/javascript' : 'text/plain; charset=utf-8';

  return new Response(snippet.code, {
    headers: { 'Content-Type': contentType },
  });
};

