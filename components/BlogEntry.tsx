import React from "react";
import Link from "next/link";
import { Post } from "../interfaces";
import day from "dayjs";

interface Props {
  post: Post;
}

const BlogEntry = ({ post }: Props) => {
  const { slug, title, date } = post;
  const path = `/blog/${post.slug}/`;

  return (
    <div className="blog_feed__entry" key={slug}>
      <p className="blog_feed__entry__meta">
        {/* <span className="blog_feed__entry__type">
          {youtube ? "Video" : "Article"}{" "}
        </span> */}
        <span className="blog_feed__entry__date">
          {day(date).format("MMMM D, YYYY")}
        </span>
      </p>
      <Link href={path}>
        <a className="blog_feed__entry__title">{title}</a>
      </Link>
      {/* {youtube ? (
        <YT title={title} youtube={youtube} defer />
      ) : (
        <p className="blog_feed__entry__excerpt">{excerpt}</p>
      )} */}
      {/* {excerpt.trim().length > 1 ? ( */}
      <p>
        <Link href={path}>
          <a>Read article</a>
        </Link>
      </p>
      {/* ) : null} */}
      {/* <Tags tags={tags} /> */}
    </div>
  );
};

export default BlogEntry;