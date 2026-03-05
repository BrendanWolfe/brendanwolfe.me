// @ts-check
import { defineConfig, envField } from 'astro/config';
import { readFileSync } from 'node:fs';
import { getAllowedDomainsFromSiteUrl, getSiteUrl } from './config/astro/config-helpers.mjs';

import tailwindcss from '@tailwindcss/vite';
import node from '@astrojs/node';

import vue from '@astrojs/vue';

const siteSettings = JSON.parse(readFileSync(new URL('./src/content/site-settings.json', import.meta.url), 'utf8'));
const siteUrl = getSiteUrl(siteSettings.siteUrl);
const allowedDomainPatterns = getAllowedDomainsFromSiteUrl(siteUrl);

// https://astro.build/config
export default defineConfig({
  site: siteUrl,
  output: 'static',
  env: {
    schema: {
      PUBLIC_TURNSTILE_SITE_KEY: envField.string({
        context: 'server',
        access: 'public',
        optional: true
      }),
      TURNSTILE_SECRET_KEY: envField.string({
        context: 'server',
        access: 'secret',
        optional: true
      }),
      TURNSTILE_EXPECTED_HOSTNAME: envField.string({
        context: 'server',
        access: 'public',
        optional: true
      }),
      SMTP_HOST: envField.string({
        context: 'server',
        access: 'public',
        optional: true
      }),
      SMTP_PORT: envField.string({
        context: 'server',
        access: 'public',
        optional: true
      }),
      SMTP_USER: envField.string({
        context: 'server',
        access: 'public',
        optional: true
      }),
      SMTP_PASS: envField.string({
        context: 'server',
        access: 'secret',
        optional: true
      }),
      SMTP_SECURE: envField.string({
        context: 'server',
        access: 'public',
        optional: true
      }),
      CONTACT_TO_EMAIL: envField.string({
        context: 'server',
        access: 'public',
        optional: true
      }),
      CONTACT_FROM_EMAIL: envField.string({
        context: 'server',
        access: 'public',
        optional: true
      })
    }
  },
  adapter: node({
    mode: 'standalone'
  }),
  security: {
    allowedDomains: allowedDomainPatterns
  },

  vite: {
    plugins: [tailwindcss()]
  },

  integrations: [vue()]
});
