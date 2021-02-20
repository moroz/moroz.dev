export interface Post {
  slug: string;
  date: string;
  title: string;
  content: string;
  filename: string;
  lang?: string;
}

export interface Video {
  slug: string;
  date: string;
  title: string;
  content: string;
  filename: string;
  youtube: string;
}
