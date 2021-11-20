import { HTMLProps } from "react";
import { UseFormRegister } from "react-hook-form";
import clsx from "clsx";
import classes from "./InputField.module.sass";

interface Props extends HTMLProps<HTMLInputElement> {
  register: UseFormRegister<any>;
  label: string;
  name: string;
}

const InputField = ({ type, label, required, id, name, register }: Props) => {
  return (
    <div className={clsx(classes.root, { [classes.required]: required })}>
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        required={required}
        type={type ?? "text"}
        {...register(name, { required })}
      />
    </div>
  );
};

export default InputField;
