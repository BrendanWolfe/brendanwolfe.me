/// <reference types="astro/client" />

interface TurnstileRenderOptions {
  sitekey: string;
  action?: string;
  callback?: (token: string) => void;
  'expired-callback'?: () => void;
  'error-callback'?: () => void;
}

declare global {
  interface Window {
    umami?: {
      track: (eventName: string, eventData?: Record<string, unknown>) => void;
    };
    turnstile?: {
      render: (container: HTMLElement, options: TurnstileRenderOptions) => string | number;
      reset: (widgetId?: string | number) => void;
    };
  }
}

export {};
