import { GetStaticPaths, GetStaticProps } from "next";
import React from "react";
import BlogPage, { BlogPageProps } from "../../../components/blog/BlogPage";
import { getSortedPostData, POSTS_PER_PAGE } from "../../../lib/api/blog";

const BlogNextPage: React.FC<BlogPageProps> = (props) => {
  return <BlogPage {...props} />;
};

export const getStaticPaths: GetStaticPaths = async () => {
  const posts = await getSortedPostData();
  const pageCount = Math.ceil(posts.length / POSTS_PER_PAGE);
  return {
    paths: new Array(pageCount - 1).fill(null).map((_, i) => ({
      params: {
        page: String(i + 2)
      }
    })),
    fallback: false
  };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  let page = Number(params?.page);
  let offset = (page - 1) * POSTS_PER_PAGE;
  const allPosts = await getSortedPostData();
  const pageCount = Math.ceil(allPosts.length / POSTS_PER_PAGE);
  const posts = allPosts.slice(offset, offset + POSTS_PER_PAGE);

  return {
    props: {
      posts,
      pageCount,
      currentPage: page
    }
  };
};

export default BlogNextPage;
