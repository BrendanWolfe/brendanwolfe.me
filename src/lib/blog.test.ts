import { describe, expect, it } from 'vitest';
import { formatBlogDate, getBlogCategories, sortBlogPosts } from './blog';
import { normalizeBlogImageKey } from './blog-images';

const posts = [
  {
    id: 'tailwind-layout-notes',
    data: {
      title: 'Tailwind Layout Notes',
      category: 'CSS',
      publishDate: new Date('2026-03-10'),
    },
  },
  {
    id: 'using-astro-content-collections',
    data: {
      title: 'Using Astro Content Collections',
      category: 'Astro',
      publishDate: new Date('2026-03-13'),
    },
  },
  {
    id: 'astro-routing-basics',
    data: {
      title: 'Astro Routing Basics',
      category: 'Astro',
      publishDate: new Date('2026-03-12'),
    },
  },
];

describe('sortBlogPosts', () => {
  it('sorts posts newest first', () => {
    const sorted = sortBlogPosts(posts, 'newest');

    expect(sorted.map((post) => post.id)).toEqual([
      'using-astro-content-collections',
      'astro-routing-basics',
      'tailwind-layout-notes',
    ]);
  });

  it('sorts posts oldest first', () => {
    const sorted = sortBlogPosts(posts, 'oldest');

    expect(sorted.map((post) => post.id)).toEqual([
      'tailwind-layout-notes',
      'astro-routing-basics',
      'using-astro-content-collections',
    ]);
  });
});

describe('getBlogCategories', () => {
  it('returns unique categories sorted alphabetically', () => {
    expect(getBlogCategories(posts)).toEqual(['Astro', 'CSS']);
  });
});

describe('formatBlogDate', () => {
  it('formats dates for blog metadata', () => {
    expect(formatBlogDate(new Date('2026-03-13'))).toBe('Mar 13, 2026');
  });
});

describe('normalizeBlogImageKey', () => {
  it('uses the post slug plus filename as the lookup key for nested blog images', () => {
    expect(normalizeBlogImageKey('/src/assets/images/blog/using-astro-content-collections/featured.png')).toBe(
      'using-astro-content-collections/featured.png',
    );
  });
});
