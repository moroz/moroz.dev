import { GetStaticPaths, GetStaticProps } from "next";
import { Post } from "../../interfaces";
import Layout from "../../layout/Layout";
import { getAllPostSlugs, getPostData } from "../../lib/api/blog";
import { formatMarkdown } from "../../lib/api/markdown";
import day from "dayjs";

interface Props {
  post: Post;
  html: string;
}

const BlogPostPage = ({ post, html }: Props) => {
  const { title, date } = post;
  return (
    <Layout title={title}>
      <div className="container">
        <h1 className="page-title">{title}</h1>
        <p className="blog__date">{day(date).format("MMMM D, YYYY")}</p>
        <div
          className="blog__content"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </div>
    </Layout>
  );
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const post = getPostData(params?.slug as string);
  const html = await formatMarkdown(post.content);
  return {
    props: {
      post,
      html
    }
  };
};

export const getStaticPaths: GetStaticPaths = async () => {
  const posts = getAllPostSlugs();

  return {
    paths: posts.map((slug) => {
      return {
        params: {
          slug
        }
      };
    }),
    fallback: false
  };
};

export default BlogPostPage;
