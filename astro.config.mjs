// @ts-check
import { defineConfig } from 'astro/config';
import { loadEnv } from 'vite';
import { getAllowedDomainsFromSiteUrl, getSiteUrl } from './config/astro/config-helpers.mjs';

import tailwindcss from '@tailwindcss/vite';
import node from '@astrojs/node';

import vue from '@astrojs/vue';

const env = loadEnv(process.env.NODE_ENV ?? 'development', process.cwd(), '');
const siteUrl = getSiteUrl(env.SITE_URL);
const allowedDomainPatterns = getAllowedDomainsFromSiteUrl(siteUrl);

// https://astro.build/config
export default defineConfig({
  site: siteUrl,
  output: 'static',
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
