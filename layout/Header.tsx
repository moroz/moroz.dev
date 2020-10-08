import Link from "next/link";

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
  return (
    <header className="header">
      <div className="header__branding">
        <Link href="/">
          <a className="header__branding__logo">moroz.dev</a>
        </Link>
      </div>
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
