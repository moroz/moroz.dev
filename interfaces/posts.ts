export interface Post {
  slug: string;
  date: string;
  datePretty: string;
  title: string;
  content: string;
  filename: string;
  lang?: string;
  summary?: string | null;
  summaryPlain: string | null;
  draft: boolean;
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
