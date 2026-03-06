<script setup lang="ts">
import { useField } from 'vee-validate';
import { nextTick, onMounted, ref } from 'vue';

interface Props {
  name?: string;
  containerId: string;
  siteKey: string;
  action: string;
  expiredMessage?: string;
  requiredMessage?: string;
  loadErrorMessage?: string;
  missingKeyMessage?: string;
}

type TurnstileErrorType = 'none' | 'load' | 'missing' | 'custom';

const props = withDefaults(defineProps<Props>(), {
  name: 'cf-turnstile-response',
  expiredMessage: 'Captcha expired. Please complete the challenge again.',
  requiredMessage: 'Please complete the captcha challenge.',
  loadErrorMessage: 'Captcha failed to load. Please refresh and try again.',
  missingKeyMessage: 'Turnstile is not configured. Set PUBLIC_TURNSTILE_SITE_KEY.'
});

const widgetId = ref<string | number | undefined>(undefined);
const errorType = ref<TurnstileErrorType>('none');
const { value, errorMessage, setErrors, setValue } = useField<string>(() => props.name, undefined, {
  initialValue: ''
});

function setError(type: TurnstileErrorType, message: string): void {
  errorType.value = type;
  setErrors(message ? [message] : []);
}

function setToken(token: string): void {
  setValue(token);
}

function getToken(): string {
  return value.value || '';
}

function clearError(): void {
  setError('none', '');
}

function clearCustomError(): void {
  if (errorType.value === 'custom') {
    clearError();
  }
}

function waitForTurnstile(timeoutMs = 5000): Promise<void> {
  if (window.turnstile) {
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    const startedAt = Date.now();
    const intervalId = window.setInterval(() => {
      if (window.turnstile) {
        window.clearInterval(intervalId);
        resolve();
        return;
      }

      if (Date.now() - startedAt >= timeoutMs) {
        window.clearInterval(intervalId);
        reject(new Error('Timed out waiting for Turnstile.'));
      }
    }, 50);
  });
}

function getLoadOrMissingError(): string {
  if (errorType.value === 'load' || errorType.value === 'missing') {
    return errorMessage.value || '';
  }

  return '';
}

function getErrorMessage(): string {
  return errorMessage.value || '';
}

function validate(): boolean {
  const blockingError = getLoadOrMissingError();
  if (blockingError) {
    return false;
  }

  if (!getToken()) {
    setError('custom', props.requiredMessage);
    return false;
  }

  clearCustomError();
  return true;
}

function reset(message?: string): void {
  setToken('');
  if (message) {
    setError('custom', message);
  } else {
    clearError();
  }

  if (window.turnstile) {
    window.turnstile.reset(widgetId.value);
  }
}

defineExpose({
  getErrorMessage,
  getToken,
  reset,
  validate
});

function loadTurnstileScript(): Promise<void> {
  if (window.turnstile) {
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    const existingScript = document.querySelector<HTMLScriptElement>('script[data-turnstile-script="true"]');

    if (existingScript) {
      existingScript.addEventListener(
        'load',
        () => {
          void waitForTurnstile().then(resolve).catch(reject);
        },
        { once: true }
      );
      existingScript.addEventListener('error', () => reject(new Error('Failed to load Turnstile script.')), { once: true });
      void waitForTurnstile().then(resolve).catch(() => {
        reject(new Error('Failed to load Turnstile script.'));
      });
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
    script.async = true;
    script.defer = true;
    script.dataset.turnstileScript = 'true';
    script.addEventListener(
      'load',
      () => {
        void waitForTurnstile().then(resolve).catch(reject);
      },
      { once: true }
    );
    script.addEventListener('error', () => reject(new Error('Failed to load Turnstile script.')), { once: true });
    document.head.append(script);
  });
}

async function initializeTurnstile(): Promise<void> {
  const container = document.getElementById(props.containerId);
  if (!container) {
    return;
  }

  if (!props.siteKey) {
    setError('missing', props.missingKeyMessage);
    return;
  }

  try {
    await loadTurnstileScript();

    if (!window.turnstile) {
      setError('load', props.loadErrorMessage);
      return;
    }

    widgetId.value = window.turnstile.render(container, {
      sitekey: props.siteKey,
      action: props.action,
      callback: (token: string) => {
        setToken(token);
        clearError();
      },
      'expired-callback': () => {
        setToken('');
        setError('custom', props.expiredMessage);
      },
      'error-callback': () => {
        setToken('');
        setError('load', props.loadErrorMessage);
      }
    });
  } catch {
    setError('load', props.loadErrorMessage);
  }
}

onMounted(async () => {
  await nextTick();
  await initializeTurnstile();
});
</script>

<template>
  <div class="grid gap-2">
    <div :id="containerId"></div>
    <p class="text-xs text-bw-body">Protected by Cloudflare Turnstile.</p>
    <p v-if="errorMessage" class="text-sm text-red-300">{{ errorMessage }}</p>
  </div>
</template>
