import type { APIRoute } from 'astro';
// @ts-ignore
import snippetsData from '../../data/snippets.json';

export const prerender = true;

export async function getStaticPaths() {
  return Object.keys(snippetsData.analysis).map(runtime => ({
    params: { runtime }
  }));
}

export const GET: APIRoute = async ({ params }) => {
  const runtimeData = snippetsData.analysis[params.runtime!];
  if (!runtimeData) {
    return new Response('Runtime not found', { status: 404 });
  }

  const metadata = runtimeData.snippets.map(({ code, ...meta }) => meta);

  const data = {
    runtime: params.runtime,
    schema_version: 1,
    generated_at: new Date().toISOString(),
    snippets: metadata,
  };

  return new Response(JSON.stringify(data), {
    headers: {
      'Content-Type': 'application/json',
    },
  });
};