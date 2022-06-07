import React from "react";
import { Post } from "../../../interfaces";
import Layout from "../../../layout/Layout";
import BlogEntry from "../../BlogEntry";
import Pagination from "../Pagination";

export interface BlogPageProps {
  posts: Post[];
  pageCount: number;
  currentPage: number;
}

const BlogPage = ({ posts, pageCount, currentPage }: BlogPageProps) => {
  return (
    <Layout>
      <div className="container">
        <h1 className="page-title">Blog</h1>
        {posts.map((post, index) => {
          return <BlogEntry post={post} key={index} />;
        })}
      </div>
      <Pagination currentPage={currentPage} pageCount={pageCount} />
    </Layout>
  );
};

export default BlogPage;
