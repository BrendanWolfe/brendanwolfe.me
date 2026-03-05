import type { APIRoute } from 'astro';
import { UMAMI_SCRIPT, UMAMI_WEBSITE_ID } from 'astro:env/server';

export const prerender = false;

const LOCAL_EVENT_PATH = '/api/event';

export const GET: APIRoute = async () => {
  const scriptUrl = UMAMI_SCRIPT;
  const websiteId = UMAMI_WEBSITE_ID;

  if (!scriptUrl || !websiteId) {
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
  const bootstrap = `;(()=>{const s=document.currentScript;if(s){s.setAttribute('data-website-id',${JSON.stringify(websiteId)});s.setAttribute('data-host-url','/');}})();\n`;
  const proxiedScript = `${bootstrap}${upstreamScript.replace(/\/api\/send/g, LOCAL_EVENT_PATH)}`;

  return new Response(proxiedScript, {
    status: 200,
    headers: {
      'Content-Type': 'application/javascript; charset=utf-8',
      'Cache-Control': 'public, max-age=900, s-maxage=900',
      'X-Content-Type-Options': 'nosniff'
    }
  });
};
