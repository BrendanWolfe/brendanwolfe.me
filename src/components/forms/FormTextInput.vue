<script setup lang="ts">
import { computed } from 'vue';
import { useField } from 'vee-validate';

interface Props {
  name: string;
  label: string;
  type?: string;
  autocomplete?: string;
  inputmode?: HTMLInputElement['inputMode'];
  placeholder?: string;
  disabled?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  type: 'text',
  autocomplete: undefined,
  inputmode: undefined,
  placeholder: '',
  disabled: false
});

const { value, errorMessage } = useField<string>(() => props.name, undefined, {
  initialValue: ''
});

const inputId = computed(() => `bw-field-${props.name.replace(/[^a-zA-Z0-9_-]+/g, '-')}`);
const errorId = computed(() => `${inputId.value}-error`);
const describedBy = computed(() => (errorMessage.value ? errorId.value : undefined));
</script>

<template>
  <div class="grid gap-2">
    <label class="bw-form-label" :for="inputId">{{ label }}</label>
    <input
      :id="inputId"
      v-model="value"
      class="bw-form-input"
      :type="type"
      :name="name"
      :autocomplete="autocomplete"
      :inputmode="inputmode"
      :placeholder="placeholder"
      :disabled="disabled"
      :aria-invalid="errorMessage ? 'true' : 'false'"
      :aria-describedby="describedBy"
    />
    <p :id="errorId" class="bw-form-error">{{ errorMessage }}</p>
  </div>
</template>
