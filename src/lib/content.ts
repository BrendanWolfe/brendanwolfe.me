import { getCollection, type CollectionEntry } from 'astro:content';

type NavItem = CollectionEntry<'navItems'>['data'];
type Project = CollectionEntry<'projects'>['data'];
type SiteSettings = CollectionEntry<'siteSettings'>['data'];

export async function getNavItems(): Promise<NavItem[]> {
  const items = await getCollection('navItems');
  return items.map(({ data }) => data).sort((a, b) => a.order - b.order);
}

export async function getProjects(): Promise<Project[]> {
  const projects = await getCollection('projects');
  return projects.map(({ data }) => data).sort((a, b) => a.order - b.order);
}

export async function getSiteSettings(): Promise<SiteSettings> {
  const settings = await getCollection('siteSettings');
  const first = settings[0]?.data;

  if (!first) {
    throw new Error('Missing siteSettings entry in src/content/site-settings.json');
  }

  return first;
}
