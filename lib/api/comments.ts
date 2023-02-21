import { Comment } from "@interfaces/comments";
import { useCallback, useEffect, useState } from "react";

export const API_URL = process.env.NEXT_PUBLIC_COMMENT_API_URL;
export const CDN_URL = process.env.NEXT_PUBLIC_COMMENT_CDN_URL;

export const fetchPostComments = async (url: string) => {
  try {
    const res = await fetch(`${CDN_URL}/comments${url}`);
    return res.json();
  } catch (e) {
    return { comments: [] };
  }
};

export const usePostComments = (url: string, initial: Comment[] = []) => {
  const [apiData, setApiData] = useState(null);

  const getComments = useCallback(async () => {
    const { comments } = await fetchPostComments(url);
    if (comments) setApiData(comments);
  }, []);

  useEffect(() => {
    getComments();
  }, []);

  return apiData ?? initial;
};
