import { useMutation } from "@apollo/client";
import gql from "graphql-tag";
import { Comment, CommentInput } from "../interfaces/comments";

export const CREATE_COMMENT = gql`
  mutation CreateComment($input: CommentInput!) {
    createComment(input: $input) {
      id
    }
  }
`;

export interface CreateCommentMutationResult {
  createComment: Comment | null;
}

export interface CreateCommentMutationVars {
  input: CommentInput;
}

export const useCreateCommentMutation = () =>
  useMutation<CreateCommentMutationResult, CreateCommentMutationVars>(
    CREATE_COMMENT
  );
