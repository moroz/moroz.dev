import React from "react";
import NewCommentForm from "../NewCommentForm";
import { Comment } from "@interfaces";
import CommentList from "../CommentList";
import { usePostComments } from "@lib/api/comments";

interface Props {
  url: string;
  comments?: Comment[];
}

const CommentSection: React.FC<Props> = ({
  url,
  comments: initialComments
}) => {
  const { comments, append } = usePostComments(url, initialComments);

  return (
    <section id="comments" className="blog-comments container">
      <h2>Comments ({comments.length})</h2>
      <CommentList comments={comments} />
      <NewCommentForm onSuccess={append} />
    </section>
  );
};

export default CommentSection;
