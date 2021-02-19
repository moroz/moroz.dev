import React from "react";

interface Props {
  open: boolean;
  onToggle(): void;
}

const Hamburger = ({ onToggle }: Props) => {
  return (
    <div className="hamburger" id="hamburgerToggle" onClick={onToggle}>
      <div className="hamburger__inner">
        <span></span>
        <span></span>
        <span></span>
      </div>
    </div>
  );
};

export default Hamburger;
