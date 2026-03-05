import { ActionError, defineAction } from 'astro:actions';
import { z } from 'astro/zod';
import createDOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';

import { sendContactEmail } from '../lib/server/mailer';
import { checkContactRateLimit } from '../lib/server/rateLimit';
import { verifyTurnstile } from '../lib/server/turnstile';

const MIN_HUMAN_SUBMIT_MS = 3000;
const CONTACT_SUCCESS_MESSAGE = 'Thanks, your message has been sent.';
const CONTACT_ERROR_MESSAGE = 'Unable to send your message right now. Please try again later.';
const INVALID_NAME_MESSAGE = 'Please enter your name.';
const INVALID_EMAIL_MESSAGE = 'Please enter a valid email address.';
const INVALID_MESSAGE_MESSAGE = 'Please add a message between 10 and 2000 characters.';

const { window } = new JSDOM('');
const DOMPurify = createDOMPurify(window);

const formString = z.preprocess((value) => (typeof value === 'string' ? value : ''), z.string());

function normalizeWhitespace(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

function stripControlCharacters(value: string): string {
  return value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '');
}

function sanitizeWithDOMPurify(value: string): string {
  const withoutHtml = DOMPurify.sanitize(value, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: []
  });
  return stripControlCharacters(withoutHtml);
}

function sanitizeSingleLine(value: string): string {
  return normalizeWhitespace(sanitizeWithDOMPurify(value));
}

function sanitizeMultiLine(value: string): string {
  const normalizedNewLines = value.replace(/\r\n?/g, '\n');
  return sanitizeWithDOMPurify(normalizedNewLines).trim();
}

function parseMaybeTimestamp(value: string): number | null {
  const parsed = Number(sanitizeSingleLine(value));
  return Number.isFinite(parsed) ? parsed : null;
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

const contactInputSchema = z
  .object({
    name: formString
      .transform(sanitizeSingleLine)
      .pipe(z.string().min(2, INVALID_NAME_MESSAGE).max(120, INVALID_NAME_MESSAGE)),
    email: formString
      .transform((value) => sanitizeSingleLine(value).toLowerCase())
      .pipe(z.string().min(3, INVALID_EMAIL_MESSAGE).max(254, INVALID_EMAIL_MESSAGE).email(INVALID_EMAIL_MESSAGE)),
    message: formString
      .transform(sanitizeMultiLine)
      .pipe(z.string().min(10, INVALID_MESSAGE_MESSAGE).max(2000, INVALID_MESSAGE_MESSAGE)),
    'cf-turnstile-response': formString
      .transform(sanitizeSingleLine)
      .pipe(z.string().min(1, 'Please complete the captcha challenge.')),
    company: formString.transform(sanitizeSingleLine),
    formLoadedAt: formString.transform(parseMaybeTimestamp)
  })
  .refine(
    (input) => input.formLoadedAt !== null && Date.now() - input.formLoadedAt >= MIN_HUMAN_SUBMIT_MS,
    {
      message: 'Please wait a moment before submitting.',
      path: ['formLoadedAt']
    }
  );

export const server = {
  contact: defineAction({
    accept: 'form',
    input: contactInputSchema,
    handler: async (input, context) => {
      if (input.company) {
        return {
          ok: true as const,
          message: CONTACT_SUCCESS_MESSAGE
        };
      }

      const ip = getClientIp(context.request, context.clientAddress);

      const turnstileCheck = await verifyTurnstile({
        token: input['cf-turnstile-response'],
        remoteIp: ip,
        expectedAction: 'contact_form'
      });

      if (!turnstileCheck.ok) {
        throw new ActionError({
          code: 'BAD_REQUEST',
          message: 'Captcha verification failed. Please try again.'
        });
      }

      const rateLimit = checkContactRateLimit(ip, input.email);
      if (!rateLimit.allowed) {
        throw new ActionError({
          code: 'TOO_MANY_REQUESTS',
          message: `Too many requests. Please try again in about ${rateLimit.retryAfterSeconds ?? 60} seconds.`
        });
      }

      try {
        await sendContactEmail({
          name: input.name,
          email: input.email,
          subject: `brendanwolfe.me Contact Form: ${input.name}`,
          message: input.message,
          clientIp: ip,
          userAgent: context.request.headers.get('user-agent') ?? 'unknown'
        });
      } catch (error) {
        console.error('[contact action] failed to process submission', error);
        throw new ActionError({
          code: 'INTERNAL_SERVER_ERROR',
          message: CONTACT_ERROR_MESSAGE
        });
      }

      return {
        ok: true as const,
        message: CONTACT_SUCCESS_MESSAGE
      };
    }
  })
};
