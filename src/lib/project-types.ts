import type { ImageMetadata } from 'astro';
import type { CollectionEntry } from 'astro:content';

type ProjectEntry = CollectionEntry<'projects'>['data'];

export type Project = Omit<ProjectEntry, 'image'> & {
  image: ImageMetadata;
};
