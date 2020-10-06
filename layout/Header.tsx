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
      <div className="header__branding">moroz.dev</div>
      <nav className="header__menu">
        <NavLink href="/">Home</NavLink>
        <NavLink href="/contact">Contact</NavLink>
      </nav>
    </header>
  );
};

export default Header;
