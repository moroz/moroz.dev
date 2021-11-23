import { HTMLProps } from "react";
import { FieldError, UseFormRegister } from "react-hook-form";
import clsx from "clsx";
import classes from "./InputField.module.sass";

interface Props extends HTMLProps<HTMLInputElement> {
  register: UseFormRegister<any>;
  label: string;
  name: string;
  errors?: Record<string, FieldError>;
}

const InputField = ({
  type,
  label,
  required,
  id,
  name,
  register,
  errors,
  ...rest
}: Props) => {
  const error = errors?.[name];
  return (
    <div
      className={clsx(classes.root, {
        [classes.required]: required,
        [classes.hasError]: error
      })}
    >
      <label htmlFor={id}>{label}</label>
      {error ? (
        <span className={classes.errorExplanation}>{error?.message}</span>
      ) : null}
      <input
        id={id}
        type={type ?? "text"}
        {...register(name, { required })}
        {...rest}
      />
    </div>
  );
};

export default InputField;
