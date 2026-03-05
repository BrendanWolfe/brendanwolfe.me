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
3. Deploy the generated `dist/` directory to your host.

### Netlify

- Build command: `npm run build`
- Publish directory: `dist`

### Vercel

- Framework preset: Astro
- Build command: `npm run build`
- Output directory: `dist`

### Cloudflare Pages

- Build command: `npm run build`
- Build output directory: `dist`
- Node compatibility: enable if your project integrations require it
