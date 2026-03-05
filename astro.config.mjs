// @ts-check
import { defineConfig } from 'astro/config';
import { loadEnv } from 'vite';
import { getAllowedDomainsFromSiteUrl, getSiteUrl, toBoolean } from './config/astro/config-helpers.mjs';

import tailwindcss from '@tailwindcss/vite';
import node from '@astrojs/node';

import vue from '@astrojs/vue';

const env = loadEnv(process.env.NODE_ENV ?? 'development', process.cwd(), '');
const siteUrl = getSiteUrl(env.SITE_URL);
const trustProxy = toBoolean(env.TRUST_PROXY) ?? true;
const allowedDomainPatterns = getAllowedDomainsFromSiteUrl(siteUrl);

// https://astro.build/config
export default defineConfig({
  site: siteUrl,
  output: 'static',
  adapter: node({
    mode: 'standalone'
  }),
  security: {
    // `trustProxy` is supported in newer Astro releases; keep it env-driven here.
    // @ts-expect-error local Astro type defs may lag this config key
    trustProxy,
    allowedDomains: allowedDomainPatterns
  },

  vite: {
    plugins: [tailwindcss()]
  },

  integrations: [vue()]
});
