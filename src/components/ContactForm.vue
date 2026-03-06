<script setup lang="ts">
import { toTypedSchema } from '@vee-validate/valibot';
import * as v from 'valibot';
import BaseForm from './forms/BaseForm.vue';
import FormTextInput from './forms/FormTextInput.vue';
import FormTextarea from './forms/FormTextarea.vue';

interface Props {
  formspreeEndpoint?: string;
  turnstileSiteKey?: string;
}

const props = withDefaults(defineProps<Props>(), {
  formspreeEndpoint: '',
  turnstileSiteKey: ''
});

const INVALID_NAME_MESSAGE = 'Please enter your name.';
const INVALID_EMAIL_MESSAGE = 'Please enter a valid email address.';
const INVALID_MESSAGE_MESSAGE = 'Please add a message between 10 and 2000 characters.';

const validationSchema = toTypedSchema(
  v.object({
    name: v.pipe(
      v.string(),
      v.trim(),
      v.minLength(2, INVALID_NAME_MESSAGE),
      v.maxLength(120, INVALID_NAME_MESSAGE)
    ),
    email: v.pipe(v.string(), v.trim(), v.email(INVALID_EMAIL_MESSAGE), v.maxLength(254, INVALID_EMAIL_MESSAGE)),
    message: v.pipe(
      v.string(),
      v.trim(),
      v.minLength(10, INVALID_MESSAGE_MESSAGE),
      v.maxLength(2000, INVALID_MESSAGE_MESSAGE)
    )
  })
);
</script>

<template>
  <BaseForm
    :action="props.formspreeEndpoint.trim()"
    actionName="contact"
    ariaLabel="Contact form"
    submit-label="Send Message"
    :validation-schema="validationSchema"
    :turnstile-site-key="props.turnstileSiteKey.trim()"
  >
    <template #default="{ isSubmitting }">
      <div class="grid gap-3">
        <FormTextInput
          name="name"
          label="Name"
          type="text"
          autocomplete="name"
          placeholder="Your name"
          :disabled="isSubmitting"
        />

        <FormTextInput
          name="email"
          label="Email"
          type="email"
          autocomplete="email"
          inputmode="email"
          placeholder="you@example.com"
          :disabled="isSubmitting"
        />

        <FormTextarea
          name="message"
          label="Message"
          :rows="5"
          placeholder="Tell me about the project, role, or collaboration."
          :disabled="isSubmitting"
        />
      </div>
    </template>
  </BaseForm>
</template>
