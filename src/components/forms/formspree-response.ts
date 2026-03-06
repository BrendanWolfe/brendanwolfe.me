const DEFAULT_SUCCESS_MESSAGE = 'Thanks, your message has been sent.';
const DEFAULT_ERROR_MESSAGE = 'Something went wrong. Please try again.';

interface FormspreeErrorEntry {
  field?: string;
  message?: string;
}

interface FormspreeErrorPayload {
  errors?: FormspreeErrorEntry[];
  ok?: boolean;
  message?: string;
}

export type NormalizedFormspreeResponse =
  | {
      ok: true;
      message: string;
    }
  | {
      ok: false;
      fieldErrors: Record<string, string>;
      formError: string;
      captchaError: boolean;
    };

function isCaptchaError(message: string): boolean {
  return /captcha|turnstile/i.test(message);
}

export function normalizeFormspreeResponse(payload: unknown): NormalizedFormspreeResponse {
  if (typeof payload === 'object' && payload !== null) {
    const typedPayload = payload as FormspreeErrorPayload;

    if (typedPayload.ok === true) {
      return {
        ok: true,
        message: typeof typedPayload.message === 'string' && typedPayload.message.length > 0
          ? typedPayload.message
          : DEFAULT_SUCCESS_MESSAGE
      };
    }

    if (Array.isArray(typedPayload.errors) && typedPayload.errors.length > 0) {
      const fieldErrors: Record<string, string> = {};
      let formError = '';
      let captchaError = false;

      for (const entry of typedPayload.errors) {
        if (!entry || typeof entry !== 'object') {
          continue;
        }

        const message = typeof entry.message === 'string' && entry.message.length > 0 ? entry.message : '';
        if (!message) {
          continue;
        }

        if (typeof entry.field === 'string' && entry.field.length > 0 && !(entry.field in fieldErrors)) {
          fieldErrors[entry.field] = message;
        }

        if (!formError) {
          formError = message;
        }

        captchaError ||= isCaptchaError(message);
      }

      return {
        ok: false,
        fieldErrors,
        formError: formError || DEFAULT_ERROR_MESSAGE,
        captchaError
      };
    }
  }

  return {
    ok: false,
    fieldErrors: {},
    formError: DEFAULT_ERROR_MESSAGE,
    captchaError: false
  };
}
