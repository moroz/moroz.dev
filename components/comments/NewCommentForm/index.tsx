import { ChangeEvent, useState } from "react";
import clsx from "clsx";
import { useRouter } from "next/router";
import { useForm } from "react-hook-form";
import { Comment, CommentInput } from "@interfaces";
import InputField from "../InputField";
import classes from "./NewCommentForm.module.sass";
import { createComment } from "@lib/api/comments";

const isValidURL = (url: string) => {
  try {
    const parsed = new URL(url);
    if (!["http:", "https:"].includes(parsed.protocol)) return false;
    if (!parsed.host.match(/\./)) return false;
    return true;
  } catch (e) {
    return false;
  }
};

interface Props {
  onSuccess: (comment: Comment) => void;
}

const NewCommentForm: React.FC<Props> = ({ onSuccess: append }) => {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    reset,
    setError,
    clearErrors,
    formState: { errors },
    setValue
  } = useForm<CommentInput>();
  const url = router.asPath;

  const [mutating, setMutating] = useState(false);

  const onSubmit = async (partial: CommentInput) => {
    try {
      setMutating(true);
      const result = await createComment(url, partial);
      if (result.success) {
        reset();
        append(result.comment);
      }
      console.log(result);
    } catch (e) {
      console.log(e);
    } finally {
      setMutating(false);
    }
  };

  const validateWebsite = (e: ChangeEvent<HTMLInputElement>) => {
    let url = e.target.value.trim();
    if (!url) {
      clearErrors("website");
      return;
    }
    if (!url.match(/^https?:\/\//)) {
      url = `http://${url}`;
      setValue("website", url);
    }
    if (!isValidURL(url)) {
      setError("website", {
        type: "validate",
        message: "is not a valid website URL"
      });
    } else {
      clearErrors("website");
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      id="new-comment"
      className={clsx(classes.root)}
    >
      <h3>Leave a Reply</h3>
      <p>
        Your email address will not be published. Required fields are marked
        with an asterisk (*).
      </p>
      <div>
        <label htmlFor="new_comment_body" className={classes.required}>
          Your comment: *
        </label>
        <textarea
          id="new_comment_body"
          rows={5}
          required
          {...register("body", { required: true })}
        ></textarea>
      </div>
      <div className={classes.fieldGroup}>
        <InputField
          name="signature"
          id="new_comment_signature"
          label="Your name:"
          register={register}
          errors={errors}
          required
        />
        <InputField
          name="email"
          id="new_comment_email"
          label="Email:"
          register={register}
          errors={errors}
          required
        />
        <InputField
          name="website"
          id="new_comment_website"
          label="Website:"
          errors={errors}
          register={register}
          onBlur={validateWebsite}
        />
      </div>
      <div className="visually-hidden">
        <InputField
          type="checkbox"
          name="iAmARobot"
          label="I am not a human"
          register={register}
          tabIndex={-1}
        />
      </div>
      <button type="submit" disabled={mutating}>
        Submit comment
      </button>
    </form>
  );
};

export default NewCommentForm;
