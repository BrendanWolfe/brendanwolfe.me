import type { APIRoute } from 'astro';
import { getSiteSettings } from '../lib/content';

export const prerender = false;

export const GET: APIRoute = async () => {
  const { umamiScript: scriptUrl } = await getSiteSettings();

  if (import.meta.env.DEV || !scriptUrl) {
    return new Response('// analytics disabled\n', {
      status: 200,
      headers: {
        'Content-Type': 'application/javascript; charset=utf-8',
        'Cache-Control': 'no-store'
      }
    });
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

  return new Response(upstreamScript, {
    status: 200,
    headers: {
      'Content-Type': 'application/javascript; charset=utf-8',
      'Cache-Control': 'public, max-age=900, s-maxage=900',
      'X-Content-Type-Options': 'nosniff'
    }
  });
};
