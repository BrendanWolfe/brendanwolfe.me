# brendanwolfe.me

Personal portfolio site built with Astro.

## Commands

| Command | Action |
| :--- | :--- |
| `npm install` | Install dependencies |
| `npm run dev` | Start local development server |
| `npm run build` | Build static output to `dist/` |
| `npm run preview` | Preview production build locally |
| `npm run astro -- --help` | Show Astro CLI help |

## Deployment

1. Install dependencies with `npm ci` (or `npm install`).
2. Build the site with `npm run build`.
3. Run the Astro Node entrypoint (`node dist/server/entry.mjs`) in your container/host.

## Contact Form Setup

The contact form submits directly to Formspree from the browser and stays on-page by posting with `fetch` and `Accept: application/json`.

1. Create a Formspree form and copy its endpoint into `contactFormEndpoint` in `src/content/site-settings.json`.
2. Enable Cloudflare Turnstile in the Formspree dashboard for that form.
3. Put the Turnstile site key in `turnstileSiteKey` in `src/content/site-settings.json`.
4. Allow your local and production domains in the Turnstile widget configuration.

The Turnstile secret is managed in Formspree, not in this app.

## Site Settings

`src/content/site-settings.json` is the source of truth for:

- `siteUrl`
- `navBrandText`
- `resumeUrl`
- `githubUrl`
- `contactFormEndpoint`
- `turnstileSiteKey`
- `umamiScript`
- `umamiWebsiteId`

Umami is loaded via `/stats.js`, with `data-website-id` and `data-host-url` set from `site-settings.json` in the `<head>` script tag.