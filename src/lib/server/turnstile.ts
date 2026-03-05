interface VerifyTurnstileInput {
  token: string;
  remoteIp?: string;
  expectedAction?: string;
}

interface TurnstileVerifyResponse {
  success: boolean;
  hostname?: string;
  action?: string;
  challenge_ts?: string;
  'error-codes'?: string[];
}

export async function verifyTurnstile(input: VerifyTurnstileInput): Promise<{ ok: true } | { ok: false; message: string }> {
  const secret = import.meta.env.TURNSTILE_SECRET_KEY;

  if (!secret) {
    return { ok: false, message: 'Turnstile server secret is not configured.' };
  }

  const formBody = new URLSearchParams({
    secret,
    response: input.token
  });

  if (input.remoteIp) {
    formBody.set('remoteip', input.remoteIp);
  }

  const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    headers: {
      'content-type': 'application/x-www-form-urlencoded'
    },
    body: formBody
  });

  if (!response.ok) {
    return { ok: false, message: 'Could not verify captcha challenge.' };
  }

  const payload = (await response.json()) as TurnstileVerifyResponse;

  if (!payload.success) {
    return { ok: false, message: 'Captcha validation failed.' };
  }

  if (input.expectedAction && payload.action && payload.action !== input.expectedAction) {
    return { ok: false, message: 'Captcha action mismatch.' };
  }

  const expectedHostname = import.meta.env.TURNSTILE_EXPECTED_HOSTNAME;
  if (expectedHostname && payload.hostname && payload.hostname !== expectedHostname) {
    return { ok: false, message: 'Captcha hostname mismatch.' };
  }

  return { ok: true };
}
