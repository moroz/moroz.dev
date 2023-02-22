import { Comment, CommentInput } from "@interfaces";
import { useCallback, useEffect, useState } from "react";

export const CDN_URL = process.env.NEXT_PUBLIC_COMMENT_CDN_URL;

export interface CreateCommentErrorResult {
  success: false;
  errors: string[];
  comment: null;
}

export interface CreateCommentSuccessResult {
  success: true;
  errors: [];
  comment: Comment;
}

export type CreateCommentResult =
  | CreateCommentErrorResult
  | CreateCommentSuccessResult;

export const createComment = async (url: string, params: CommentInput) => {
  const input = { ...params, url };
  const res = await fetch(`${CDN_URL}/comments`, {
    method: "POST",
    body: JSON.stringify(input)
  });
  return res.json() as Promise<CreateCommentResult>;
};

export interface ListPostCommentsResult {
  comment: Comment[];
}

export const fetchPostComments = async (url: string) => {
  try {
    const res = await fetch(`${CDN_URL}/comments${url}`);
    return res.json();
  } catch (e) {
    console.error("Failed to fetch comments:", e);
    return { comments: [] };
  }
};

export const usePostComments = (url: string, initial: Comment[] = []) => {
  const [apiData, setApiData] = useState<Comment[] | null>(null);

  const append = useCallback(
    (comment: Comment) => {
      if (!comment) {
        return;
      }
      setApiData((comments) => [...(comments ?? []), comment]);
    },
    [setApiData]
  );

  const getComments = useCallback(async () => {
    const { comments } = await fetchPostComments(url);
    if (comments) setApiData(comments);
  }, []);

  useEffect(() => {
    getComments();
  }, []);

  return { comments: apiData ?? initial, append };
};
