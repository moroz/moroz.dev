import React from "react";
import { Comment } from "../../../interfaces/comments";

interface Props {
  comments: Comment[];
}

const CommentList = ({ comments }: Props) => {
  return (
    <div>
      {comments ? <pre>{JSON.stringify(comments, null, 2)}</pre> : null}
    </div>
  );
};

export default CommentList;
