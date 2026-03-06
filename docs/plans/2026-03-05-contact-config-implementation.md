# Contact Config Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Remove contact-form environment variables by storing the public Formspree endpoint and Turnstile site key in site settings and passing them into the prerendered form.

**Architecture:** The existing content collection remains the source of truth for public site config. Astro reads the contact settings from `site-settings.json` at build time and passes them through Astro component props into the Vue form, which already hydrates on the client and lazy-loads the Turnstile script.

**Tech Stack:** Astro 5, Vue 3, Astro content collections, vee-validate, Valibot

---

### Task 1: Extend public site settings

**Files:**
- Modify: `src/content/site-settings.json`
- Modify: `src/content.config.ts`

**Step 1:** Add `contactFormEndpoint` and `turnstileSiteKey` to `src/content/site-settings.json`.

**Step 2:** Extend the `siteSettings` schema in `src/content.config.ts` so both fields are typed strings.

**Step 3:** Run `npm run build`.
Expected: Astro content sync succeeds with the updated schema.

### Task 2: Pass config through Astro and Vue

**Files:**
- Modify: `src/pages/index.astro`
- Modify: `src/components/home/HomeContact.astro`
- Modify: `src/components/ContactForm.vue`
- Modify: `src/components/forms/BaseForm.vue`
- Modify: `src/components/forms/TurnstileField.vue`

**Step 1:** Pass `contactFormEndpoint` and `turnstileSiteKey` from `index.astro` into `HomeContact.astro`.

**Step 2:** Pass those props from `HomeContact.astro` into `ContactForm.vue`.

**Step 3:** Replace `astro:env/client` usage in `ContactForm.vue` and `BaseForm.vue` with prop-based values.

**Step 4:** Simplify the Turnstile missing-config message so it no longer references env vars.

**Step 5:** Run `npm run build`.
Expected: Build completes and the contact form bundle no longer references `PUBLIC_` variables.

### Task 3: Remove obsolete env plumbing and docs

**Files:**
- Modify: `astro.config.mjs`
- Modify: `README.md`
- Delete: `.env.example`
- Modify: `Dockerfile`

**Step 1:** Remove the now-unused `env.schema` block from `astro.config.mjs`.

**Step 2:** Remove Docker build-arg wiring that was only needed for the discarded env-based approach.

**Step 3:** Update `README.md` to document contact-form configuration via `src/content/site-settings.json`.

**Step 4:** Remove `.env.example` because the project no longer requires form-related env vars.

**Step 5:** Run `npm run build`.
Expected: Build remains green after cleanup.
