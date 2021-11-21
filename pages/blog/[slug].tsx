import { GetStaticPaths, GetStaticProps } from "next";
import { Post } from "../../interfaces";
import Layout from "../../layout/Layout";
import { getAllPostSlugs, getPostData } from "../../lib/api/blog";
import { formatMarkdown } from "../../lib/api/markdown";
import Link from "next/link";
import Head from "next/head";
import { useRouter } from "next/router";
import { addApolloState, initializeApollo } from "../../lib/apolloClient";
import { LIST_COMMENTS } from "../../gql/commentQueries";
import CommentSection from "../../components/comments/CommentSection";

interface Props {
  post: Post;
  html: string;
}

const BlogPostPage = (props: Props) => {
  const { post, html } = props;
  const router = useRouter();
  const url = router.asPath;
  const { summary, summaryPlain, title, datePretty, lang = "en" } = post;
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
        <main
          role="main"
          className="blog__content"
          dangerouslySetInnerHTML={{ __html: html }}
        />
        <Link href="/blog">
          <a>&lt;&lt; Back to blog</a>
        </Link>
      </article>
      <CommentSection url={url} />
    </Layout>
  );
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const apolloClient = initializeApollo();

  const slug = params!.slug as string;
  const post = await getPostData(slug);
  const html = await formatMarkdown(post.content);

  await apolloClient.query({
    query: LIST_COMMENTS,
    variables: {
      url: `/blog/${slug}`
    }
  });

  const baseProps = {
    props: {
      post,
      html
    }
  };

  return addApolloState(apolloClient, baseProps);
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
