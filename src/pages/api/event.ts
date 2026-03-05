import type { APIRoute } from 'astro';
import { UMAMI_SCRIPT } from 'astro:env/server';
import { checkEventRateLimit } from '../../lib/server/rateLimit';

export const prerender = false;
const MAX_EVENT_BODY_BYTES = 32 * 1024;

function getUpstreamSendUrl(scriptUrl: string): string {
  return new URL('/api/send', scriptUrl).toString();
}

function getClientIp(request: Request, clientAddress?: string): string {
  if (clientAddress) {
    return clientAddress;
  }

  const forwardedFor = request.headers.get('x-forwarded-for');
  if (!forwardedFor) {
    return 'unknown';
  }

  return forwardedFor.split(',')[0]?.trim() || 'unknown';
}

export const POST: APIRoute = async ({ request, clientAddress }) => {
  const scriptUrl = UMAMI_SCRIPT;

  if (!scriptUrl) {
    return new Response(JSON.stringify({ ok: false }), {
      status: 503,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-store'
      }
    });
  }

  const requestContentType = request.headers.get('content-type')?.toLowerCase() ?? '';
  if (!requestContentType.startsWith('application/json')) {
    return new Response(JSON.stringify({ ok: false, message: 'Unsupported content type.' }), {
      status: 415,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-store'
      }
    });
  }

  const contentLengthRaw = request.headers.get('content-length');
  if (contentLengthRaw && Number(contentLengthRaw) > MAX_EVENT_BODY_BYTES) {
    return new Response(JSON.stringify({ ok: false, message: 'Payload too large.' }), {
      status: 413,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-store'
      }
    });
  }

  const clientIp = getClientIp(request, clientAddress);
  const rateLimit = checkEventRateLimit(clientIp);
  if (!rateLimit.allowed) {
    return new Response(JSON.stringify({ ok: false, message: 'Too many events.' }), {
      status: 429,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-store',
        'Retry-After': String(rateLimit.retryAfterSeconds ?? 60)
      }
    });
  }

  const upstreamUrl = getUpstreamSendUrl(scriptUrl);
  const body = await request.text();
  if (body.length > MAX_EVENT_BODY_BYTES) {
    return new Response(JSON.stringify({ ok: false, message: 'Payload too large.' }), {
      status: 413,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-store'
      }
    });
  }

  const headers = new Headers();
  headers.set('Accept', 'application/json');
  headers.set('Content-Type', request.headers.get('content-type') ?? 'application/json');

  const userAgent = request.headers.get('user-agent');
  if (userAgent) {
    headers.set('User-Agent', userAgent);
  }

  headers.set('X-Forwarded-For', clientIp);

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
  const responseContentType = upstreamResponse.headers.get('content-type') ?? 'application/json; charset=utf-8';

  return new Response(responseBody, {
    status: upstreamResponse.status,
    headers: {
      'Content-Type': responseContentType,
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
