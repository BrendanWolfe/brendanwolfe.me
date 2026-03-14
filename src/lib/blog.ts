type SortDirection = 'newest' | 'oldest';

type BlogLike = {
  data: {
    category: string;
    publishDate: Date;
  };
};

export function sortBlogPosts<T extends BlogLike>(posts: T[], direction: SortDirection = 'newest'): T[] {
  return [...posts].sort((left, right) => {
    const delta = left.data.publishDate.valueOf() - right.data.publishDate.valueOf();
    return direction === 'oldest' ? delta : -delta;
  });
}

export function getBlogCategories<T extends BlogLike>(posts: T[]): string[] {
  return [...new Set(posts.map((post) => post.data.category))].sort((left, right) =>
    left.localeCompare(right),
  );
}

export function formatBlogDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date);
}
