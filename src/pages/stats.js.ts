import type { APIRoute } from 'astro';
import { getSecret } from 'astro:env/server';

export const prerender = false;

const LOCAL_EVENT_PATH = '/api/event';

function getUmamiScriptUrl(): string | undefined {
  return getSecret('UMAMI_SCRIPT') ?? import.meta.env.UMAMI_SCRIPT;
}

export const GET: APIRoute = async () => {
  const scriptUrl = getUmamiScriptUrl();

  if (!scriptUrl) {
    return new Response('', { status: 404 });
  }

  let upstreamResponse: Response;
  try {
    upstreamResponse = await fetch(scriptUrl, {
      headers: {
        Accept: 'application/javascript, text/javascript;q=0.9, */*;q=0.8'
      }
    });
  } catch {
    return new Response('', { status: 502 });
  }

  if (!upstreamResponse.ok) {
    return new Response('', { status: 502 });
  }

  const upstreamScript = await upstreamResponse.text();
  const proxiedScript = upstreamScript.replace(/\/api\/send/g, LOCAL_EVENT_PATH);

  return new Response(proxiedScript, {
    status: 200,
    headers: {
      'Content-Type': 'application/javascript; charset=utf-8',
      'Cache-Control': 'public, max-age=900, s-maxage=900',
      'X-Content-Type-Options': 'nosniff'
    }
  });
};
