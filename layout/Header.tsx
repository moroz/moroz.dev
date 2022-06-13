import clsx from "clsx";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import Hamburger from "./Hamburger";
import styles from "./Header.module.sass";

const SCROLL_THRESHOLD = 40;

interface NavLinkProps {
  href: string;
  children: any;
}

const NavLink = ({ href, children }: NavLinkProps) => {
  return (
    <Link href={href}>
      <a className={styles.navlink}>{children}</a>
    </Link>
  );
};

interface Props {
  white?: boolean;
}

const Header: React.FC<Props> = ({ white }) => {
  const [hamburgerOpen, setHamburgerOpen] = useState(false);
  const [opaque, setOpaque] = useState(false);

  const handleScroll = useCallback(() => {
    setOpaque(window.pageYOffset >= SCROLL_THRESHOLD);
  }, [setOpaque]);

  useEffect(() => {
    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <header
      className={clsx(
        styles.header,
        hamburgerOpen && styles.isOpen,
        opaque && styles.isOpaque,
        white && styles.isWhite
      )}
    >
      <div className={styles.content}>
        <h1 className={styles.branding}>
          <Link href="/">
            <a>moroz.dev</a>
          </Link>
        </h1>
      </div>
      <nav className={styles.menu}>
        <NavLink href="/">Home</NavLink>
        <NavLink href="/blog">Blog</NavLink>
        <NavLink href="/videos">Videos</NavLink>
        <NavLink href="/contact">Contact</NavLink>
        <Link href="/resume.pdf">
          <a className={clsx(styles.cta, "button")} target="_blank">
            R&eacute;sum&eacute;
          </a>
        </Link>
      </nav>
      <Hamburger
        open={hamburgerOpen}
        onToggle={() => setHamburgerOpen((t) => !t)}
      />
    </header>
  );
};

export default Header;
