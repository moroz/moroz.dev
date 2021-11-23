import clsx from "clsx";
import { useRouter } from "next/router";
import { useForm } from "react-hook-form";
import { useCreateCommentMutation } from "../../../gql/commentMutations";
import { CommentInput } from "../../../interfaces/comments";
import InputField from "../InputField";
import classes from "./NewCommentForm.module.sass";

const NewCommentForm = () => {
  const router = useRouter();
  const { register, handleSubmit, reset } = useForm<CommentInput>();
  const url = router.asPath;
  const [mutate, { loading: mutating }] = useCreateCommentMutation();

  const onSubmit = async (partial: CommentInput) => {
    const input = { ...partial, url };
    const result = await mutate({ variables: { input } });
    if (result.data?.createComment?.success) {
      reset();
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
          required
        />
        <InputField
          name="email"
          id="new_comment_email"
          label="Email:"
          register={register}
          required
        />
        <InputField
          name="website"
          id="new_comment_website"
          label="Website:"
          register={register}
        />
      </div>
      <div className="visually-hidden">
        <InputField
          type="checkbox"
          name="iAmARobot"
          label="I am not a human"
          register={register}
        />
      </div>
      <button type="submit" disabled={mutating}>
        Submit comment
      </button>
    </form>
  );
};

export default NewCommentForm;
