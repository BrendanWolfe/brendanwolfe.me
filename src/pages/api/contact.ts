import type { APIRoute } from 'astro';

import { sendContactEmail } from '../../lib/server/mailer';
import { checkContactRateLimit } from '../../lib/server/rateLimit';
import { verifyTurnstile } from '../../lib/server/turnstile';

export const prerender = false;

const MIN_HUMAN_SUBMIT_MS = 3000;

interface ContactInput {
  name: string;
  email: string;
  message: string;
  turnstileToken: string;
  company: string;
  formLoadedAt: number | null;
}

function json(status: number, body: { ok: boolean; message: string }): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store'
    }
  });
}

function normalizeWhitespace(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

function parseContactInput(formData: FormData): ContactInput {
  const name = normalizeWhitespace(formData.get('name')?.toString() ?? '');
  const email = normalizeWhitespace(formData.get('email')?.toString().toLowerCase() ?? '');
  const message = (formData.get('message')?.toString() ?? '').trim();
  const turnstileToken = (formData.get('cf-turnstile-response')?.toString() ?? '').trim();
  const company = (formData.get('company')?.toString() ?? '').trim();
  const formLoadedRaw = (formData.get('formLoadedAt')?.toString() ?? '').trim();
  const formLoadedAt = Number.isFinite(Number(formLoadedRaw)) ? Number(formLoadedRaw) : null;

  return {
    name,
    email,
    message,
    turnstileToken,
    company,
    formLoadedAt
  };
}

function validateContactInput(input: ContactInput): { ok: true } | { ok: false; message: string } {
  if (input.name.length < 2 || input.name.length > 120) {
    return { ok: false, message: 'Please enter your name.' };
  }

  if (input.email.length < 3 || input.email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email)) {
    return { ok: false, message: 'Please enter a valid email address.' };
  }

  if (input.message.length < 10 || input.message.length > 2000) {
    return { ok: false, message: 'Please add a message between 10 and 2000 characters.' };
  }

  if (!input.turnstileToken) {
    return { ok: false, message: 'Please complete the captcha challenge.' };
  }

  if (!input.formLoadedAt || Date.now() - input.formLoadedAt < MIN_HUMAN_SUBMIT_MS) {
    return { ok: false, message: 'Please wait a moment before submitting.' };
  }

  return { ok: true };
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
