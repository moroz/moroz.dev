import { useQuery } from "@apollo/client";
import gql from "graphql-tag";
import type { Comment } from "../interfaces/comments";

export const LIST_COMMENTS = gql`
  query ListComments($url: String!) {
    listComments(url: $url) {
      id
      remoteIp
      body
      signature
      insertedAt
      url
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
