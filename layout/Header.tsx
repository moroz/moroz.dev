import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import Hamburger from "./Hamburger";

interface NavLinkProps {
  href: string;
  children: any;
}

const NavLink = ({ href, children }: NavLinkProps) => {
  return (
    <Link href={href}>
      <a className="header__navlink">{children}</a>
    </Link>
  );
};

const Header = () => {
  const [hamburgerOpen, setHamburgerOpen] = useState(false);
  const [opaque, setOpaque] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  const handleScroll = useCallback(() => {
    setOpaque(window.pageYOffset > ref.current?.clientHeight!);
  }, [setOpaque, ref.current]);

  useEffect(() => {
    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <header
      className={`header ${hamburgerOpen ? "header--menu-open" : ""} ${
        opaque ? "header--opaque" : ""
      }`}
      ref={ref}
    >
      <div className="header__branding">
        <Link href="/">
          <a className="header__branding__logo">moroz.dev</a>
        </Link>
      </div>
      <Hamburger
        open={hamburgerOpen}
        onToggle={() => setHamburgerOpen((t) => !t)}
      />
      <nav className="header__menu">
        <NavLink href="/">Home</NavLink>
        <NavLink href="/projects">Projects</NavLink>
        <NavLink href="/blog">Blog</NavLink>
        <NavLink href="/videos">Videos</NavLink>
        <NavLink href="/contact">Contact</NavLink>
        <Link href="/resume.pdf">
          <a className="header__cta button" target="_blank">
            R&eacute;sum&eacute;
          </a>
        </Link>
      </nav>
    </header>
  );
};

export default Header;
