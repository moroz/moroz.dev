import React from "react";
import { Comment } from "../../../interfaces/comments";
import CommentItem from "../CommentItem";

interface Props {
  comments: Comment[];
}

const CommentList = ({ comments }: Props) => {
  return (
    <div>
      {comments?.map((comment) => (
        <CommentItem comment={comment} key={comment.id} />
      ))}
    </div>
  );
};

export default CommentList;
