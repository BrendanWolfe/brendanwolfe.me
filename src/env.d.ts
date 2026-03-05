/// <reference types="astro/client" />

declare global {
  interface Window {
    umami?: {
      track: (eventName: string, eventData?: Record<string, unknown>) => void;
    };
    turnstile?: {
      reset: () => void;
    };
  }
}

export {};
