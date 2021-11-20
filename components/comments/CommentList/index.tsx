import React from "react";
import { useListCommentsQuery } from "../../../gql/commentQueries";

interface Props {
  url: string;
}

const CommentList = ({ url }: Props) => {
  const { data } = useListCommentsQuery(url);
  return <div>{data ? <pre>{JSON.stringify(data, null, 2)}</pre> : null}</div>;
};

export default CommentList;
