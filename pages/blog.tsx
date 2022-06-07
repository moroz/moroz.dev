import { GetStaticProps } from "next";
import React from "react";
import BlogPage from "../components/blog/BlogPage";
import { Post } from "../interfaces";
import { getSortedPostData, POSTS_PER_PAGE } from "../lib/api/blog";

interface Props {
  posts: Post[];
  pageCount: number;
  currentPage: number;
}

const Blog: React.FC<Props> = (props) => {
  return <BlogPage {...props} />;
};

export const getStaticProps: GetStaticProps = async () => {
  const allPosts = await getSortedPostData();
  const pageCount = Math.ceil(allPosts.length / POSTS_PER_PAGE);
  const posts = allPosts.slice(0, POSTS_PER_PAGE);
  return {
    props: {
      posts,
      pageCount,
      currentPage: 1
    }
  };
};

export default Blog;
