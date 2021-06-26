export interface Post {
  slug: string;
  date: string;
  datePretty: string;
  title: string;
  content: string;
  filename: string;
  lang?: string;
  summary?: string;
}

export interface Video {
  slug: string;
  date: string;
  datePretty: string;
  title: string;
  content: string;
  filename: string;
  youtube: string;
}
