import { useMutation } from "@apollo/client";
import gql from "graphql-tag";
import { MutationResult } from "../interfaces/common";
import { Comment, CommentInput } from "../interfaces/comments";
import { COMMENT_DETAILS_FRAGMENT, LIST_COMMENTS } from "./commentQueries";

export const CREATE_COMMENT = gql`
  ${COMMENT_DETAILS_FRAGMENT}

  mutation CreateComment($input: CommentInput!) {
    createComment(input: $input) {
      success
      errors
      data {
        ...CommentDetails
      }
    }
  }
`;

export interface CreateCommentMutationResult {
  createComment: MutationResult<Comment>;
}

export interface CreateCommentMutationVars {
  input: CommentInput;
}

export const useCreateCommentMutation = () =>
  useMutation<CreateCommentMutationResult, CreateCommentMutationVars>(
    CREATE_COMMENT,
    {
      update(cache, { data }) {
        const newComment = data?.createComment.data;
        if (!newComment) return;
        const url = newComment.url;
        const { listComments } = cache.readQuery({
          query: LIST_COMMENTS,
          variables: { url }
        })!;
        cache.writeQuery({
          query: LIST_COMMENTS,
          variables: { url },
          data: { listComments: [newComment, ...listComments] }
        });
      }
    }
  );
