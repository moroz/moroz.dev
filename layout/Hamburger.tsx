import React from "react";
import styles from "./Header.module.sass";

interface Props {
  open: boolean;
  onToggle(): void;
}

const Hamburger = ({ onToggle }: Props) => {
  return (
    <div className={styles.hamburger} id="hamburgerToggle" onClick={onToggle}>
      <div className="hamburger__inner">
        <span></span>
        <span></span>
        <span></span>
      </div>
    </div>
  );
};

export default Hamburger;
