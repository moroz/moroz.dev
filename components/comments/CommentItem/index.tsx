import { Comment } from "../../../interfaces/comments";
import { formatDateTime } from "../../../lib/dateHelpers";
import classes from "./CommentItem.module.sass";

interface Props {
  comment: Comment;
}

const CommentItem = ({ comment }: Props) => {
  return (
    <article className={classes.root}>
      <p className={classes.meta}>
        <span className={classes.signature}>{comment.signature}</span>
        <span className={classes.ts}>
          {" "}
          on {formatDateTime(comment.insertedAt)}
        </span>
      </p>
      <div
        className={classes.body}
        dangerouslySetInnerHTML={{ __html: comment.body }}
      />
    </article>
  );
};

export default CommentItem;
