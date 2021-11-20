import { useQuery } from "@apollo/client";
import gql from "graphql-tag";
import type { Comment } from "../interfaces/comments";

export const COMMENT_DETAILS_FRAGMENT = gql`
  fragment CommentDetails on Comment {
    id
    remoteIp
    body
    signature
    url
    website
    insertedAt
  }
`;

export const LIST_COMMENTS = gql`
  ${COMMENT_DETAILS_FRAGMENT}

  query ListComments($url: String!) {
    listComments(url: $url) {
      ...CommentDetails
    }
  }
`;

export interface ListCommentsQueryResult {
  listComments: Comment[];
}

export interface ListCommentsQueryVars {
  url: string;
}

export const useListCommentsQuery = (url: string) =>
  useQuery<ListCommentsQueryResult, ListCommentsQueryVars>(LIST_COMMENTS, {
    variables: { url }
  });
