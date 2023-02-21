import { GetStaticPaths, GetStaticProps } from "next";
import { Post } from "../../interfaces";
import Layout from "../../layout/Layout";
import { getAllPostSlugs, getPostDataBySlug } from "../../lib/api/blog";
import { mdToReact } from "../../lib/api/markdown";
import Link from "next/link";
import Head from "next/head";
import { MDXRemote } from "next-mdx-remote";
import CommentSection from "../../components/comments/CommentSection";
import { useRouter } from "next/router";

interface Props {
  post: Post;
  html: any;
}

const BlogPostPage = (props: Props) => {
  const { post, html } = props;
  const { summary, summaryPlain, title, datePretty, lang = "en" } = post;
  const router = useRouter();
  return (
    <Layout title={title}>
      {summaryPlain ? (
        <Head>
          <meta name="description" content={summaryPlain} />
        </Head>
      ) : null}
      <article className="container blog-post" lang={lang}>
        <header>
          <h1 className="page-title">{title}</h1>
          <p className="blog__date">{datePretty}</p>
        </header>
        {summary ? (
          <div className="blog__summary">
            <h3>Abstract</h3>
            <div dangerouslySetInnerHTML={{ __html: summary }} />
          </div>
        ) : null}
        <main role="main" className="blog__content">
          <MDXRemote {...html} />
        </main>
        <Link href="/blog">&lt;&lt; Back to blog</Link>
      </article>
      <CommentSection url={router.asPath} />
    </Layout>
  );
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const slug = params!.slug as string;
  const post = await getPostDataBySlug(slug);
  const html = await mdToReact(post.content);

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
    paths: posts.map(({ slug }) => {
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
