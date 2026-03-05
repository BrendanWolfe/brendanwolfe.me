# Portfolio Website Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a production-ready Astro portfolio site with `/`, `/about`, and `/contact` pages using the Slate & Steel visual system, data-driven project cards, and static deployment output.

**Architecture:** Use static Astro pages and shared `.astro` components with a single layout shell and centralized style tokens in `src/styles/global.css`. Keep project content data-driven with `src/content/projects.json` and avoid client-side frameworks/islands for this phase. Validate output with build-time HTML assertions and page-level tests before each commit.

**Tech Stack:** Astro 5, Tailwind CSS v4, TypeScript, Vitest, Node.js fs/path utilities

---

### Task 1: Establish Test Harness And Baseline Quality Gates

**Files:**
- Create: `vitest.config.ts`
- Create: `tests/site/home.spec.ts`
- Create: `tests/site/about.spec.ts`
- Create: `tests/site/contact.spec.ts`
- Create: `tests/site/seo-a11y.spec.ts`
- Modify: `package.json`

Use: `@test-driven-development`

**Step 1: Write the failing test**

```ts
// tests/site/home.spec.ts
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('home page shell', () => {
  it('has portfolio title and primary nav links', () => {
    const html = readFileSync(resolve(process.cwd(), 'dist/index.html'), 'utf8');
    expect(html).toContain('<title>Brendan Wolfe');
    expect(html).toContain('href="/about"');
    expect(html).toContain('href="/contact"');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm run build && npx vitest run tests/site/home.spec.ts -t "has portfolio title and primary nav links"`
Expected: FAIL because title/nav do not exist in the starter template output.

**Step 3: Write minimal implementation**

```json
// package.json (scripts + devDependencies)
{
  "scripts": {
    "dev": "astro dev",
    "build": "astro build",
    "preview": "astro preview",
    "test": "vitest",
    "test:once": "vitest run",
    "check": "astro check"
  },
  "devDependencies": {
    "vitest": "^2.1.0"
  }
}
```

```ts
// vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/**/*.spec.ts']
  }
});
```

**Step 4: Run test to verify it passes**

Run: `npm install && npm run build && npm run test:once -- tests/site/home.spec.ts -t "has portfolio title and primary nav links"`
Expected: PASS once later tasks wire title/nav; keep this test committed now as red-green anchor for subsequent tasks.

**Step 5: Commit**

```bash
git add package.json package-lock.json vitest.config.ts tests/site/home.spec.ts tests/site/about.spec.ts tests/site/contact.spec.ts tests/site/seo-a11y.spec.ts
git commit -m "test: add site-level vitest harness"
```

### Task 2: Build Shared Layout With Slate & Steel Tokens

**Files:**
- Create: `src/layouts/BaseLayout.astro`
- Modify: `src/styles/global.css`
- Modify: `src/pages/index.astro`

Use: `@tailwindcss-development`

**Step 1: Write the failing test**

```ts
// tests/site/home.spec.ts
it('applies Slate & Steel design tokens at root', () => {
  const html = readFileSync(resolve(process.cwd(), 'dist/index.html'), 'utf8');
  expect(html).toContain('--bg:#151a22');
  expect(html).toContain('--accent:#5b9bd5');
});
```

**Step 2: Run test to verify it fails**

Run: `npm run build && npm run test:once -- tests/site/home.spec.ts -t "applies Slate & Steel design tokens at root"`
Expected: FAIL because tokens are not defined.

**Step 3: Write minimal implementation**

```astro
---
import '../styles/global.css';
interface Props { title?: string; description?: string }
const { title = 'Brendan Wolfe | Web Developer', description = 'Portfolio website for Brendan Wolfe' } = Astro.props;
---
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>{title}</title>
    <meta name="description" content={description} />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500&family=Manrope:wght@600;700&display=swap" rel="stylesheet" />
  </head>
  <body class="site-body">
    <slot />
  </body>
</html>
```

```css
/* src/styles/global.css */
@import "tailwindcss";
:root {
  --bg: #151a22;
  --surface: #1a2130;
  --surface-hover: #1e2738;
  --border: #232b38;
  --accent: #5b9bd5;
  --accent-hover: #8ebed8;
  --text-heading: #c8d6e0;
  --text-sub: #b0c4d8;
  --text-body: #6a8aa0;
  --text-muted: #4a5a6a;
  --skill-bg: #1c2430;
  --skill-text: #6a8aa0;
}
```

**Step 4: Run test to verify it passes**

Run: `npm run build && npm run test:once -- tests/site/home.spec.ts -t "applies Slate & Steel design tokens at root"`
Expected: PASS.

**Step 5: Commit**

```bash
git add src/layouts/BaseLayout.astro src/styles/global.css src/pages/index.astro tests/site/home.spec.ts
git commit -m "feat: add shared base layout and Slate & Steel tokens"
```

### Task 3: Add Navigation And Footer Components

**Files:**
- Create: `src/components/Nav.astro`
- Create: `src/components/Footer.astro`
- Modify: `src/layouts/BaseLayout.astro`

Use: `@tailwindcss-development`

**Step 1: Write the failing test**

```ts
// tests/site/home.spec.ts
it('renders global nav and footer links', () => {
  const html = readFileSync(resolve(process.cwd(), 'dist/index.html'), 'utf8');
  expect(html).toContain('href="#projects"');
  expect(html).toContain('href="/about"');
  expect(html).toContain('href="/contact"');
  expect(html).toContain('github.com');
  expect(html).toContain('linkedin.com');
});
```

**Step 2: Run test to verify it fails**

Run: `npm run build && npm run test:once -- tests/site/home.spec.ts -t "renders global nav and footer links"`
Expected: FAIL.

**Step 3: Write minimal implementation**

```astro
---
// src/components/Nav.astro
---
<nav aria-label="Primary">
  <a href="/">brendan</a>
  <a href="#projects">Projects</a>
  <a href="/about">About</a>
  <a href="/contact">Contact</a>
</nav>
```

```astro
---
// src/components/Footer.astro
---
<footer>
  <a href="https://github.com/username">GitHub</a>
  <a href="https://linkedin.com/in/username">LinkedIn</a>
  <a href="mailto:you@example.com">Email</a>
</footer>
```

```astro
---
import Nav from '../components/Nav.astro';
import Footer from '../components/Footer.astro';
---
<body>
  <Nav />
  <main>
    <slot />
  </main>
  <Footer />
</body>
```

**Step 4: Run test to verify it passes**

Run: `npm run build && npm run test:once -- tests/site/home.spec.ts -t "renders global nav and footer links"`
Expected: PASS.

**Step 5: Commit**

```bash
git add src/components/Nav.astro src/components/Footer.astro src/layouts/BaseLayout.astro tests/site/home.spec.ts
git commit -m "feat: add shared navigation and footer"
```

### Task 4: Build Hero And Skills Components For Home Page

**Files:**
- Create: `src/components/Hero.astro`
- Create: `src/components/SkillsBar.astro`
- Modify: `src/pages/index.astro`
- Test: `tests/site/home.spec.ts`

Use: `@tailwindcss-development`

**Step 1: Write the failing test**

```ts
// tests/site/home.spec.ts
it('renders hero headline and skills tags', () => {
  const html = readFileSync(resolve(process.cwd(), 'dist/index.html'), 'utf8');
  expect(html).toContain('Web Developer');
  expect(html).toContain('Problem Solver');
  expect(html).toContain('TypeScript');
  expect(html).toContain('Laravel');
});
```

**Step 2: Run test to verify it fails**

Run: `npm run build && npm run test:once -- tests/site/home.spec.ts -t "renders hero headline and skills tags"`
Expected: FAIL.

**Step 3: Write minimal implementation**

```astro
---
// src/components/Hero.astro
---
<section>
  <h1>Web Developer <span>&amp; Problem Solver</span></h1>
  <p>I build practical web experiences with performance, accessibility, and maintainability in mind.</p>
</section>
```

```astro
---
// src/components/SkillsBar.astro
const skills = ['React', 'Vue.js', 'TypeScript', 'Laravel', 'PHP', 'WordPress', 'PostgreSQL', 'Docker'];
---
<section aria-label="Skills">
  {skills.map((skill) => <span>{skill}</span>)}
</section>
```

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
import Hero from '../components/Hero.astro';
import SkillsBar from '../components/SkillsBar.astro';
---
<BaseLayout>
  <Hero />
  <SkillsBar />
</BaseLayout>
```

**Step 4: Run test to verify it passes**

Run: `npm run build && npm run test:once -- tests/site/home.spec.ts -t "renders hero headline and skills tags"`
Expected: PASS.

**Step 5: Commit**

```bash
git add src/components/Hero.astro src/components/SkillsBar.astro src/pages/index.astro tests/site/home.spec.ts
git commit -m "feat: add home hero and skills sections"
```

### Task 5: Add Data-Driven Projects Section

**Files:**
- Create: `src/content/projects.json`
- Create: `src/components/ProjectCard.astro`
- Create: `src/components/ProjectsGrid.astro`
- Modify: `src/pages/index.astro`
- Test: `tests/site/home.spec.ts`

Use: `@test-driven-development`

**Step 1: Write the failing test**

```ts
// tests/site/home.spec.ts
it('renders at least three project cards with demo and github links', () => {
  const html = readFileSync(resolve(process.cwd(), 'dist/index.html'), 'utf8');
  expect((html.match(/data-project-card/g) ?? []).length).toBeGreaterThanOrEqual(3);
  expect(html).toContain('Live Demo');
  expect(html).toContain('GitHub');
});
```

**Step 2: Run test to verify it fails**

Run: `npm run build && npm run test:once -- tests/site/home.spec.ts -t "renders at least three project cards with demo and github links"`
Expected: FAIL.

**Step 3: Write minimal implementation**

```json
[
  {
    "title": "Analytics Dashboard",
    "slug": "analytics-dashboard",
    "description": "Real-time data visualization with filterable charts and role-based views.",
    "image": "/images/projects/analytics-dashboard.png",
    "tags": ["React", "TypeScript", "Recharts"],
    "liveUrl": "https://example.com/analytics",
    "githubUrl": "https://github.com/username/analytics-dashboard"
  }
]
```

```astro
---
// src/components/ProjectCard.astro
interface Props {
  title: string;
  description: string;
  tags: string[];
  liveUrl: string;
  githubUrl: string;
}
const { title, description, tags, liveUrl, githubUrl } = Astro.props;
---
<article data-project-card>
  <h3>{title}</h3>
  <p>{description}</p>
  <ul>{tags.map((tag) => <li>{tag}</li>)}</ul>
  <a href={liveUrl}>Live Demo</a>
  <a href={githubUrl}>GitHub</a>
</article>
```

```astro
---
import projects from '../content/projects.json';
import ProjectCard from './ProjectCard.astro';
---
<section id="projects" aria-labelledby="projects-heading">
  <h2 id="projects-heading">Projects</h2>
  {projects.map((project) => <ProjectCard {...project} />)}
</section>
```

**Step 4: Run test to verify it passes**

Run: `npm run build && npm run test:once -- tests/site/home.spec.ts -t "renders at least three project cards with demo and github links"`
Expected: PASS after adding at least 3 project entries.

**Step 5: Commit**

```bash
git add src/content/projects.json src/components/ProjectCard.astro src/components/ProjectsGrid.astro src/pages/index.astro tests/site/home.spec.ts
git commit -m "feat: add data-driven projects grid"
```

### Task 6: Add Home About Blurb And Complete Home Composition

**Files:**
- Create: `src/components/AboutBlurb.astro`
- Modify: `src/pages/index.astro`
- Test: `tests/site/home.spec.ts`

Use: `@tailwindcss-development`

**Step 1: Write the failing test**

```ts
// tests/site/home.spec.ts
it('includes about blurb and learn more link', () => {
  const html = readFileSync(resolve(process.cwd(), 'dist/index.html'), 'utf8');
  expect(html).toContain('Learn more');
  expect(html).toContain('href="/about"');
});
```

**Step 2: Run test to verify it fails**

Run: `npm run build && npm run test:once -- tests/site/home.spec.ts -t "includes about blurb and learn more link"`
Expected: FAIL.

**Step 3: Write minimal implementation**

```astro
---
// src/components/AboutBlurb.astro
---
<section aria-labelledby="about-blurb-heading">
  <h2 id="about-blurb-heading">About</h2>
  <p>I enjoy solving business problems through clear product thinking and maintainable code.</p>
  <a href="/about">Learn more →</a>
</section>
```

**Step 4: Run test to verify it passes**

Run: `npm run build && npm run test:once -- tests/site/home.spec.ts -t "includes about blurb and learn more link"`
Expected: PASS.

**Step 5: Commit**

```bash
git add src/components/AboutBlurb.astro src/pages/index.astro tests/site/home.spec.ts
git commit -m "feat: add about blurb section on home page"
```

### Task 7: Build About Page Content

**Files:**
- Create: `src/pages/about.astro`
- Modify: `src/layouts/BaseLayout.astro` (if page-level meta props needed)
- Test: `tests/site/about.spec.ts`

Use: `@test-driven-development`

**Step 1: Write the failing test**

```ts
// tests/site/about.spec.ts
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('about page', () => {
  it('includes bio, grouped skills, and resume link', () => {
    const html = readFileSync(resolve(process.cwd(), 'dist/about/index.html'), 'utf8');
    expect(html).toContain('Frontend');
    expect(html).toContain('Backend');
    expect(html).toContain('Tools');
    expect(html).toContain('href="/resume.pdf"');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm run build && npm run test:once -- tests/site/about.spec.ts -t "includes bio, grouped skills, and resume link"`
Expected: FAIL because `/about` does not exist.

**Step 3: Write minimal implementation**

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
---
<BaseLayout title="About | Brendan Wolfe" description="About Brendan Wolfe">
  <section>
    <h1>About</h1>
    <p>Long-form background and experience summary.</p>
  </section>
  <section>
    <h2>Frontend</h2>
    <h2>Backend</h2>
    <h2>Tools</h2>
  </section>
  <section>
    <h2>What I'm Looking For</h2>
    <a href="/resume.pdf">Download Resume</a>
  </section>
</BaseLayout>
```

**Step 4: Run test to verify it passes**

Run: `npm run build && npm run test:once -- tests/site/about.spec.ts -t "includes bio, grouped skills, and resume link"`
Expected: PASS.

**Step 5: Commit**

```bash
git add src/pages/about.astro src/layouts/BaseLayout.astro tests/site/about.spec.ts
git commit -m "feat: add complete about page"
```

### Task 8: Build Contact Page With Visual-Only Form

**Files:**
- Create: `src/components/ContactForm.astro`
- Create: `src/pages/contact.astro`
- Test: `tests/site/contact.spec.ts`

Use: `@tailwindcss-development`

**Step 1: Write the failing test**

```ts
// tests/site/contact.spec.ts
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('contact page', () => {
  it('contains name/email/message fields and direct contact links', () => {
    const html = readFileSync(resolve(process.cwd(), 'dist/contact/index.html'), 'utf8');
    expect(html).toContain('name="name"');
    expect(html).toContain('name="email"');
    expect(html).toContain('name="message"');
    expect(html).toContain('mailto:');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm run build && npm run test:once -- tests/site/contact.spec.ts -t "contains name/email/message fields and direct contact links"`
Expected: FAIL because `/contact` does not exist.

**Step 3: Write minimal implementation**

```astro
---
// src/components/ContactForm.astro
---
<form aria-label="Contact form">
  <label>Name <input name="name" type="text" /></label>
  <label>Email <input name="email" type="email" /></label>
  <label>Message <textarea name="message"></textarea></label>
  <button type="submit">Send Message</button>
</form>
```

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
import ContactForm from '../components/ContactForm.astro';
---
<BaseLayout title="Contact | Brendan Wolfe" description="Get in touch with Brendan Wolfe">
  <section>
    <h1>Get in touch</h1>
    <ContactForm />
    <a href="mailto:you@example.com">you@example.com</a>
  </section>
</BaseLayout>
```

**Step 4: Run test to verify it passes**

Run: `npm run build && npm run test:once -- tests/site/contact.spec.ts -t "contains name/email/message fields and direct contact links"`
Expected: PASS.

**Step 5: Commit**

```bash
git add src/components/ContactForm.astro src/pages/contact.astro tests/site/contact.spec.ts
git commit -m "feat: add contact page and visual form"
```

### Task 9: Final SEO, Accessibility, And Responsive Verification

**Files:**
- Modify: `src/layouts/BaseLayout.astro`
- Modify: `src/styles/global.css`
- Test: `tests/site/seo-a11y.spec.ts`
- Modify: `README.md`

Use: `@verification-before-completion`

**Step 1: Write the failing test**

```ts
// tests/site/seo-a11y.spec.ts
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('seo and accessibility', () => {
  it('has semantic landmarks and metadata on each page', () => {
    const home = readFileSync(resolve(process.cwd(), 'dist/index.html'), 'utf8');
    const about = readFileSync(resolve(process.cwd(), 'dist/about/index.html'), 'utf8');
    const contact = readFileSync(resolve(process.cwd(), 'dist/contact/index.html'), 'utf8');
    expect(home).toContain('<main');
    expect(home).toContain('meta name="description"');
    expect(about).toContain('<main');
    expect(contact).toContain('<main');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm run build && npm run test:once -- tests/site/seo-a11y.spec.ts -t "has semantic landmarks and metadata on each page"`
Expected: FAIL until all pages/layout include semantic and metadata requirements.

**Step 3: Write minimal implementation**

```astro
---
// BaseLayout: ensure title/description props and semantic structure
---
<body>
  <a class="skip-link" href="#main-content">Skip to content</a>
  <Nav />
  <main id="main-content">
    <slot />
  </main>
  <Footer />
</body>
```

```css
/* src/styles/global.css */
.skip-link {
  position: absolute;
  left: -9999px;
}
.skip-link:focus-visible {
  left: 1rem;
  top: 1rem;
}
```

**Step 4: Run test to verify it passes**

Run: `npm run check && npm run build && npm run test:once`
Expected: PASS for Astro type checks and all Vitest suites.

**Step 5: Commit**

```bash
git add src/layouts/BaseLayout.astro src/styles/global.css tests/site/seo-a11y.spec.ts README.md
git commit -m "chore: finalize SEO and accessibility verification"
```

### Task 10: Deployment Configuration And Release Readiness

**Files:**
- Modify: `README.md`
- Modify: `astro.config.mjs` (only if static adapter settings are needed)

Use: `@verification-before-completion`

**Step 1: Write the failing test**

```ts
// tests/site/seo-a11y.spec.ts
it('includes canonical deployment instructions in README', () => {
  const readme = readFileSync(resolve(process.cwd(), 'README.md'), 'utf8');
  expect(readme).toContain('Deployment');
  expect(readme).toContain('npm run build');
  expect(readme).toContain('Netlify');
  expect(readme).toContain('Vercel');
  expect(readme).toContain('Cloudflare Pages');
});
```

**Step 2: Run test to verify it fails**

Run: `npm run test:once -- tests/site/seo-a11y.spec.ts -t "includes canonical deployment instructions in README"`
Expected: FAIL until deployment documentation is added.

**Step 3: Write minimal implementation**

```md
## Deployment

1. Run `npm ci`
2. Run `npm run build`
3. Deploy `dist/` to Netlify, Vercel, or Cloudflare Pages
```

**Step 4: Run test to verify it passes**

Run: `npm run check && npm run build && npm run test:once`
Expected: PASS.

**Step 5: Commit**

```bash
git add README.md astro.config.mjs tests/site/seo-a11y.spec.ts
git commit -m "docs: add deployment runbook"
```

Plan complete and saved to `docs/plans/2026-03-05-portfolio-website-implementation.md`. Two execution options:

1. Subagent-Driven (this session) - I dispatch fresh subagent per task, review between tasks, fast iteration
2. Parallel Session (separate) - Open new session with executing-plans, batch execution with checkpoints

Which approach?
