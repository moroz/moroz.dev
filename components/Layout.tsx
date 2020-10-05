import React, { ReactNode } from "react";
import Link from "next/link";
import Head from "next/head";

type Props = {
  children?: ReactNode;
  title?: string;
};

const Layout = ({ children, title = "This is the default title" }: Props) => (
  <div>
    <Head>
      <title>{title}</title>
      <meta charSet="utf-8" />
      <meta name="viewport" content="initial-scale=1.0, width=device-width" />
      <link
        href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
        rel="stylesheet"
      />
    </Head>
    <header className="header">
      <nav>
        <Link href="/">
          <a>Home</a>
        </Link>{" "}
      </nav>
    </header>
    {children}
    <footer>
      <span>&copy; 2020 by Karol Moroz.</span>
    </footer>
  </div>
);

export default Layout;
