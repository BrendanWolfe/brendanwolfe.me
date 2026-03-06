# Contact Config Design

**Date:** 2026-03-05

## Goal

Move the contact form's public configuration out of environment variables and into versioned site settings so the home page stays prerendered and production no longer depends on build-time or runtime env injection.

## Decision

Store the Formspree endpoint and Cloudflare Turnstile site key in `src/content/site-settings.json`.

## Why

- Both values are public and already shipped to the browser.
- The site must remain prerendered.
- Runtime config fetches and server islands add complexity without solving a secrecy problem.
- Production cannot provide these values at build time, so the current env-based implementation is brittle.

## Implementation Shape

- Extend the `siteSettings` content schema with `contactFormEndpoint` and `turnstileSiteKey`.
- Read those values through existing `getSiteSettings()` usage.
- Pass them from Astro components into the Vue contact form as props.
- Remove `astro:env/client` usage from the form components.
- Keep Turnstile lazy in behavior only: the form prerenders, hydrates, and the Turnstile script loads on mount.

## Non-Goals

- Moving Umami out of site settings.
- Adding a runtime config endpoint.
- Changing the page rendering mode.
