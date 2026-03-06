<script setup lang="ts">
import { PUBLIC_TURNSTILE_SITE_KEY } from 'astro:env/client';
import { computed, ref } from 'vue';
import { useForm } from 'vee-validate';
import TurnstileField from './TurnstileField.vue';
import { buildFormData, getFirstFieldError } from './base-form.helpers';
import { normalizeFormspreeResponse } from './formspree-response';

interface Props {
  action?: string;
  actionName?: string;
  ariaLabel?: string;
  submitLabel?: string;
  turnstileSiteKey?: string;
  turnstileRequiredMessage?: string;
  turnstileLoadErrorMessage?: string;
  turnstileMissingKeyMessage?: string;
  validationSchema?: unknown;
  initialValues?: Record<string, string>;
  withTurnstile?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  action: '',
  actionName: '',
  ariaLabel: 'Form',
  submitLabel: 'Submit',
  turnstileSiteKey: '',
  validationSchema: undefined,
  initialValues: () => ({}),
  withTurnstile: true
});

const DEFAULT_SUCCESS_MESSAGE = 'Thanks, your message has been sent.';
const DEFAULT_ERROR_MESSAGE = 'Something went wrong. Please try again.';
const CONFIGURATION_ERROR_MESSAGE = 'Contact form is not configured right now.';
const CAPTCHA_RETRY_MESSAGE = 'Captcha verification failed. Please complete the challenge again.';
const TURNSTILE_FIELD_NAME = 'cf-turnstile-response';

const isSubmitting = ref(false);
const turnstileField = ref<InstanceType<typeof TurnstileField> | null>(null);

const statusMessage = ref('');
const statusState = ref<'idle' | 'error' | 'success'>('idle');

const normalizedActionName = computed(() =>
  (props.actionName || 'form').replace(/[^a-zA-Z0-9_-]+/g, '_').toLowerCase()
);
const formRootId = computed(() => `bw-form-${normalizedActionName.value}`);
const turnstileContainerId = computed(() => `${formRootId.value}-turnstile`);
const resolvedTurnstileAction = computed(() => normalizedActionName.value);
const resolvedTurnstileSiteKey = computed(() => (props.turnstileSiteKey || PUBLIC_TURNSTILE_SITE_KEY || '').trim());

const statusClass = computed(() => {
  if (statusState.value === 'error') {
    return 'min-h-5 text-sm text-red-300';
  }

  if (statusState.value === 'success') {
    return 'min-h-5 text-sm text-green-300';
  }

  return 'min-h-5 text-sm text-bw-sub';
});

const submitLabelText = computed(() => (isSubmitting.value ? 'Sending...' : props.submitLabel));

const { handleSubmit, resetForm, setErrors } = useForm<Record<string, unknown>>({
  validationSchema: props.validationSchema,
  initialValues: {
    ...props.initialValues
  }
});

function setStatus(message: string, state: 'idle' | 'error' | 'success'): void {
  statusMessage.value = message;
  statusState.value = state;
}

function trackUmamiSubmit(): void {
  const formName = props.actionName || props.ariaLabel || 'form';
  window.umami?.track('form-submit', { form: formName });
}

const submitValidatedForm = handleSubmit(async (submittedValues) => {
  if (isSubmitting.value) {
    return;
  }

  if (props.withTurnstile && !turnstileField.value?.validate()) {
    return;
  }

  if (!props.action) {
    setStatus(CONFIGURATION_ERROR_MESSAGE, 'error');
    return;
  }

  isSubmitting.value = true;
  setStatus('Sending message...', 'idle');

  try {
    const formData = buildFormData(submittedValues);

    if (props.withTurnstile) {
      formData.set(TURNSTILE_FIELD_NAME, turnstileField.value?.getToken() || '');
    }

    const response = await fetch(props.action, {
      method: 'POST',
      body: formData,
      headers: {
        Accept: 'application/json'
      }
    });

    const payloadResult = await response.json().catch(() => null);
    const normalized = normalizeFormspreeResponse(
      response.ok && typeof payloadResult === 'object' && payloadResult !== null
        ? { ...payloadResult, ok: true }
        : response.ok
          ? { ok: true }
          : payloadResult
    );

    if (!normalized.ok) {
      const normalizedErrors: Record<string, string> = {};
      let hasTurnstileError = false;

      for (const [fieldName, message] of Object.entries(normalized.fieldErrors)) {
        if (fieldName === TURNSTILE_FIELD_NAME) {
          hasTurnstileError = true;
          turnstileField.value?.reset(message);
          continue;
        }

        normalizedErrors[fieldName] = message;
      }

      setErrors(normalizedErrors);

      if (normalized.captchaError) {
        turnstileField.value?.reset(CAPTCHA_RETRY_MESSAGE);
        return;
      }

      if (hasTurnstileError && Object.keys(normalizedErrors).length === 0) {
        return;
      }

      const firstMessage = getFirstFieldError(normalized.fieldErrors) ?? normalized.formError ?? DEFAULT_ERROR_MESSAGE;
      setStatus(firstMessage, 'error');
      return;
    }

    trackUmamiSubmit();
    setStatus(normalized.message || DEFAULT_SUCCESS_MESSAGE, 'success');

    resetForm({
      values: {
        ...props.initialValues
      }
    });
    turnstileField.value?.reset();
  } catch {
    setStatus(DEFAULT_ERROR_MESSAGE, 'error');
  } finally {
    isSubmitting.value = false;
  }
});

function onSubmit(): void {
  if (isSubmitting.value) {
    return;
  }

  setErrors({});
  setStatus('', 'idle');

  void submitValidatedForm();
}
</script>

<template>
  <form
    :id="formRootId"
    class="grid gap-3"
    :action="action || undefined"
    :aria-label="ariaLabel"
    method="post"
    novalidate
    @submit.prevent="onSubmit"
  >
    <slot :is-submitting="isSubmitting" />

    <TurnstileField
      v-if="withTurnstile"
      ref="turnstileField"
      :name="TURNSTILE_FIELD_NAME"
      :container-id="turnstileContainerId"
      :site-key="resolvedTurnstileSiteKey"
      :action="resolvedTurnstileAction"
      :required-message="turnstileRequiredMessage"
      :load-error-message="turnstileLoadErrorMessage"
      :missing-key-message="turnstileMissingKeyMessage"
    />

    <p :class="statusClass" role="status" aria-live="polite">{{ statusMessage }}</p>

    <button
      type="submit"
      :disabled="isSubmitting"
      class="mt-1 inline-flex w-fit items-center rounded-md bg-bw-accent px-4 py-2 text-base font-semibold text-bw-bg transition hover:bg-bw-accent-hover cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
    >
      <span class="inline-flex items-center gap-2">
        <svg
          v-if="isSubmitting"
          class="size-4 animate-spin"
          viewBox="0 0 16 16"
          fill="none"
          aria-hidden="true"
        >
          <circle cx="8" cy="8" r="6" class="opacity-30" stroke="currentColor" stroke-width="2" />
          <path d="M14 8a6 6 0 0 0-6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
        </svg>
        <span>{{ submitLabelText }}</span>
      </span>
    </button>
  </form>
</template>
