import React from "react";
// import NewCommentForm from "../NewCommentForm";
import CommentList from "../CommentList";
import { usePostComments } from "../../../lib/api/comments";

interface Props {
  url: string;
}

const CommentSection: React.FC<Props> = ({ url }) => {
  const comments = usePostComments(url);

  return (
    <section id="comments" className="blog-comments container">
      <h2>Comments ({comments.length})</h2>
      <CommentList comments={comments} />
      {/* <NewCommentForm /> */}
    </section>
  );
};

export default CommentSection;
