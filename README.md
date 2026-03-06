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

## Contact Form Environment Variables

Copy `.env.example` and set:

- `PUBLIC_FORMSPREE_ENDPOINT_CONTACT`
- `PUBLIC_TURNSTILE_SITE_KEY`

## Contact Form Setup

The contact form submits directly to Formspree from the browser and stays on-page by posting with `fetch` and `Accept: application/json`.

1. Create a Formspree form and copy its endpoint into `PUBLIC_FORMSPREE_ENDPOINT_CONTACT`.
2. Enable Cloudflare Turnstile in the Formspree dashboard for that form.
3. Put the Turnstile site key in `PUBLIC_TURNSTILE_SITE_KEY`.
4. Allow your local and production domains in the Turnstile widget configuration.

The Turnstile secret is managed in Formspree, not in this app.

## Site Settings

`src/content/site-settings.json` is the source of truth for:

- `siteUrl`
- `navBrandText`
- `resumeUrl`
- `githubUrl`
- `umamiScript`
- `umamiWebsiteId`

Umami is loaded via `/stats.js`, with `data-website-id` and `data-host-url` set from `site-settings.json` in the `<head>` script tag.

### Netlify

- Build command: `npm run build`
- Publish directory: `dist/client` (for fully static deployments only)

### Vercel

- Framework preset: Astro
- Build command: `npm run build`
- Output directory: `dist/client` (for fully static deployments only)

### Cloudflare Pages

- Build command: `npm run build`
- Build output directory: `dist/client` (for fully static deployments only)
- Node compatibility: enable if your project integrations require it
