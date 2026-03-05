import type { APIRoute } from 'astro';

import { parseContactInput, validateContactInput } from '../../lib/server/contactInput';
import { sendContactEmail } from '../../lib/server/mailer';
import { checkContactRateLimit } from '../../lib/server/rateLimit';
import { verifyTurnstile } from '../../lib/server/turnstile';

export const prerender = false;

function json(status: number, body: { ok: boolean; message: string }): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store'
    }
  });
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
  try {
    const formData = await request.formData();
    const input = parseContactInput(formData);

    if (input.company) {
      return json(200, {
        ok: true,
        message: 'Thanks, your message has been sent.'
      });
    }

    const validation = validateContactInput(input);
    if (!validation.ok) {
      return json(400, {
        ok: false,
        message: validation.message
      });
    }

    const ip = getClientIp(request, clientAddress);

    const turnstileCheck = await verifyTurnstile({
      token: input.turnstileToken,
      remoteIp: ip,
      expectedAction: 'contact_form'
    });

    if (!turnstileCheck.ok) {
      return json(400, {
        ok: false,
        message: 'Captcha verification failed. Please try again.'
      });
    }

    const rateLimit = checkContactRateLimit(ip, input.email);
    if (!rateLimit.allowed) {
      return json(429, {
        ok: false,
        message: `Too many requests. Please try again in about ${rateLimit.retryAfterSeconds ?? 60} seconds.`
      });
    }

    await sendContactEmail({
      name: input.name,
      email: input.email,
      subject: `brendanwolfe.me Contact Form: ${input.name}`,
      message: input.message,
      clientIp: ip,
      userAgent: request.headers.get('user-agent') ?? 'unknown'
    });

    return json(200, {
      ok: true,
      message: 'Thanks, your message has been sent.'
    });
  } catch (error) {
    console.error('[contact] failed to process submission', error);

    return json(500, {
      ok: false,
      message: 'Unable to send your message right now. Please try again later.'
    });
  }
};

export const ALL: APIRoute = async () => {
  return json(405, {
    ok: false,
    message: 'Method not allowed.'
  });
};
