import type { APIRoute } from 'astro';
import { getSecret } from 'astro:env/server';

export const prerender = false;

function getUmamiScriptUrl(): string | undefined {
  return getSecret('UMAMI_SCRIPT') ?? import.meta.env.UMAMI_SCRIPT;
}

function getUpstreamSendUrl(scriptUrl: string): string {
  return new URL('/api/send', scriptUrl).toString();
}

export const POST: APIRoute = async ({ request, clientAddress }) => {
  const scriptUrl = getUmamiScriptUrl();

  if (!scriptUrl) {
    return new Response(JSON.stringify({ ok: false }), {
      status: 503,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-store'
      }
    });
  }

  const upstreamUrl = getUpstreamSendUrl(scriptUrl);
  const body = await request.text();

  const headers = new Headers();
  headers.set('Accept', 'application/json');
  headers.set('Content-Type', request.headers.get('content-type') ?? 'application/json');

  const userAgent = request.headers.get('user-agent');
  if (userAgent) {
    headers.set('User-Agent', userAgent);
  }

  const forwardedFor = request.headers.get('x-forwarded-for') ?? clientAddress;
  if (forwardedFor) {
    headers.set('X-Forwarded-For', forwardedFor);
  }

  const umamiCache = request.headers.get('x-umami-cache');
  if (umamiCache) {
    headers.set('X-Umami-Cache', umamiCache);
  }

  let upstreamResponse: Response;
  try {
    upstreamResponse = await fetch(upstreamUrl, {
      method: 'POST',
      headers,
      body
    });
  } catch {
    return new Response(JSON.stringify({ ok: false }), {
      status: 502,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-store'
      }
    });
  }

  const responseBody = await upstreamResponse.text();
  const contentType = upstreamResponse.headers.get('content-type') ?? 'application/json; charset=utf-8';

  return new Response(responseBody, {
    status: upstreamResponse.status,
    headers: {
      'Content-Type': contentType,
      'Cache-Control': 'no-store'
    }
  });
};

export const ALL: APIRoute = async () => {
  return new Response(JSON.stringify({ ok: false, message: 'Method not allowed.' }), {
    status: 405,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store'
    }
  });
};
