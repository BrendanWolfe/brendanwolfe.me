type SortDirection = 'newest' | 'oldest';

type BlogSortable = {
  data: {
    publishDate: Date;
  };
};

type BlogWithTags = {
  data: {
    tags: string[];
  };
};

export function sortBlogPosts<T extends BlogSortable>(posts: T[], direction: SortDirection = 'newest'): T[] {
  return [...posts].sort((left, right) => {
    const delta = left.data.publishDate.valueOf() - right.data.publishDate.valueOf();
    return direction === 'oldest' ? delta : -delta;
  });
}

export function getBlogTags<T extends BlogWithTags>(posts: T[]): string[] {
  return [...new Set(posts.flatMap((post) => post.data.tags))].sort((left, right) =>
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
