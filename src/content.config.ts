import { defineCollection } from 'astro:content';
import { file } from 'astro/loaders';
import { z } from 'astro/zod';
import { readFile } from 'node:fs/promises';

const navItems = defineCollection({
  loader: file('src/content/nav-items.json', {
    parser: (text) =>
      (JSON.parse(text) as Array<{ href: string; label: string; external?: boolean }>).map((item, index) => ({
        id: `nav-${index + 1}`,
        order: index,
        ...item,
      })),
  }),
  schema: z.object({
    order: z.number().int().nonnegative(),
    href: z.string(),
    label: z.string(),
    external: z.boolean().optional(),
  }),
});

const projects = defineCollection({
  loader: async () => {
    const text = await readFile(new URL('./content/projects.json', import.meta.url), 'utf8');
    const items = JSON.parse(text) as Array<{
      title: string;
      description: string;
      image?: string;
      tags: string[];
      liveUrl: string;
      githubUrl: string;
    }>;

    return items.map((item, index) => ({
      id: `project-${index + 1}`,
      order: index,
      ...item,
    }));
  },
  schema: z.object({
    order: z.number().int().nonnegative(),
    title: z.string(),
    description: z.string(),
    image: z.string().optional(),
    tags: z.array(z.string()),
    liveUrl: z.string().url(),
    githubUrl: z.string().url(),
  }),
});

const siteSettings = defineCollection({
  loader: file('src/content/site-settings.json', {
    parser: (text) => [{ id: 'site-settings', ...JSON.parse(text) }],
  }),
  schema: z.object({
    resumeUrl: z.string(),
    navBrandText: z.string(),
    email: z.string().email(),
    githubUrl: z.string().url(),
  }),
});

export const collections = {
  navItems,
  projects,
  siteSettings,
};
