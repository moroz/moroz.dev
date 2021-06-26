import React from "react";
import Link from "next/link";
import { Post } from "../interfaces";

interface Props {
  post: Post;
}

const BlogEntry = ({ post }: Props) => {
  const { slug, title, datePretty, summary } = post;
  const path = `/blog/${post.slug}/`;

  return (
    <article className="blog_feed__entry" key={slug}>
      <p className="blog_feed__entry__meta">
        <span className="blog_feed__entry__date">{datePretty}</span>
      </p>
      <Link href={path}>
        <a className="blog_feed__entry__title">
          <h3>{title}</h3>
        </a>
      </Link>
      {summary ? <p className="blog_feed__entry__abstract">{summary}</p> : null}
      <p className="blog_feed__entry__actions">
        <Link href={path}>
          <a>Read article</a>
        </Link>
      </p>
    </article>
  );
};

export default BlogEntry;
