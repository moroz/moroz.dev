import { GetStaticProps } from "next";
import BlogEntry from "../components/BlogEntry";
import { Post } from "../interfaces";
import Layout from "../layout/Layout";
import { getAllPostData, getAllSlugs } from "../lib/api/blog";

interface Props {
  posts: Post[];
}

const Blog = ({ posts }: Props) => {
  return (
    <Layout>
      <div className="container">
        <h1 className="page-title">Blog</h1>
        {posts.map((post, index) => {
          return <BlogEntry post={post} key={index} />;
        })}
      </div>
    </Layout>
  );
};

export const getStaticProps: GetStaticProps = async () => {
  const posts = getAllPostData();
  return {
    props: {
      posts
    }
  };
};

export default Blog;
