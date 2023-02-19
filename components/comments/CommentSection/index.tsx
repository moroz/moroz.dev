import React from "react";
import { useListCommentsQuery } from "../../../gql/commentQueries";
import NewCommentForm from "../NewCommentForm";
import CommentList from "../CommentList";

interface Props {
  url: string;
}

const CommentSection = ({ url }: Props) => {
  const { data } = useListCommentsQuery(url);
  const comments = data?.listComments ?? [];
  return (
    <section id="comments" className="blog-comments container">
      <h2>Comments ({comments.length})</h2>
      <CommentList comments={comments} />
      <NewCommentForm />
    </section>
  );
};

export default CommentSection;
