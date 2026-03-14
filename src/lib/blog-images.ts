import type { ImageMetadata } from 'astro';

const importedBlogImages = import.meta.glob(
  '/src/assets/images/blog/**/*.{avif,gif,jpeg,jpg,png,webp}',
  { eager: true, import: 'default' },
) as Record<string, ImageMetadata>;

export function normalizeBlogImageKey(path: string): string {
  const marker = '/src/assets/images/blog/';
  return path.includes(marker) ? path.split(marker)[1] ?? path : path;
}

const blogImages = Object.fromEntries(
  Object.entries(importedBlogImages).map(([path, image]) => [normalizeBlogImageKey(path), image]),
) as Record<string, ImageMetadata>;

export function getBlogImage(postId: string, imageName: string): ImageMetadata {
  const image = blogImages[`${postId}/${imageName}`];

  if (!image) {
    throw new Error(`Unknown blog image "${imageName}" for post "${postId}" in src/content/blog`);
  }

  return image;
}
