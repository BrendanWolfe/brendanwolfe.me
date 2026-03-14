import type { ImageMetadata } from 'astro';

const importedProjectImages = import.meta.glob<{ default: ImageMetadata }>(
  '/src/assets/images/*.{avif,gif,jpeg,jpg,png,webp}',
  { eager: true, import: 'default' }
);

const projectImages = Object.fromEntries(
  Object.entries(importedProjectImages).map(([path, image]) => [path.split('/').pop(), image])
) as Record<string, ImageMetadata>;

export function getProjectImage(imageName: string): ImageMetadata {
  const image = projectImages[imageName];

  if (!image) {
    throw new Error(`Unknown project image "${imageName}" in src/content/projects.json`);
  }

  return image;
}
