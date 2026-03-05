import validator from 'validator';

export const MIN_HUMAN_SUBMIT_MS = 3000;

export interface ContactInput {
  name: string;
  email: string;
  message: string;
  turnstileToken: string;
  company: string;
  formLoadedAt: number | null;
}

function normalizeWhitespace(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

function sanitizeSingleLine(value: string): string {
  const withoutControlChars = validator.stripLow(value);
  return normalizeWhitespace(validator.trim(withoutControlChars));
}

function sanitizeMultiLine(value: string): string {
  const normalizedNewLines = value.replace(/\r\n?/g, '\n');
  return validator.trim(validator.stripLow(normalizedNewLines, true));
}

export function parseContactInput(formData: FormData): ContactInput {
  const name = sanitizeSingleLine(formData.get('name')?.toString() ?? '');
  const email = sanitizeSingleLine(formData.get('email')?.toString() ?? '').toLowerCase();
  const message = sanitizeMultiLine(formData.get('message')?.toString() ?? '');
  const turnstileToken = sanitizeSingleLine(formData.get('cf-turnstile-response')?.toString() ?? '');
  const company = sanitizeSingleLine(formData.get('company')?.toString() ?? '');
  const formLoadedRaw = sanitizeSingleLine(formData.get('formLoadedAt')?.toString() ?? '');
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

export function validateContactInput(input: ContactInput): { ok: true } | { ok: false; message: string } {
  if (!validator.isLength(input.name, { min: 2, max: 120 })) {
    return { ok: false, message: 'Please enter your name.' };
  }

  if (!validator.isLength(input.email, { min: 3, max: 254 }) || !validator.isEmail(input.email)) {
    return { ok: false, message: 'Please enter a valid email address.' };
  }

  if (!validator.isLength(input.message, { min: 10, max: 2000 })) {
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
