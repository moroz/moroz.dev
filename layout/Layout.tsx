import React, { ReactNode, useEffect, useMemo, useState } from "react";
import Head from "next/head";
import Header from "./Header";
import Footer from "./Footer";
import clsx from "clsx";
import { isSafari, isDesktop } from "../lib/browser";

type Props = {
  children?: ReactNode;
  title?: string;
  className?: string;
  whiteHeader?: boolean;
};

const description = `Learn Web development with Karol Moroz. Programming tips & tricks, Elixir, React, Svelte, TypeScript learning resources, blog, videos, and more.`;

const Layout = ({ children, title, className, whiteHeader }: Props) => {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  const classes = useMemo(() => {
    return clsx({
      "is-safari": isSafari(),
      "is-desktop": isDesktop()
    });
  }, [hydrated]);

  return (
    <div className={clsx("layout", className, hydrated && classes)}>
      <Head>
        <title>{title ? `${title} | moroz.dev` : "moroz.dev"}</title>
        <meta charSet="utf-8" />
        <meta name="viewport" content="initial-scale=1.0, width=device-width" />
        <meta name="description" content={description} />
        <link rel="icon" href="/favicon.svg" />
        <meta name="theme-color" content="#131723" />
      </Head>
      <Header white={whiteHeader} />
      <main role="main" id="main">
        {children}
      </main>
      <Footer />
    </div>
  );
};

export default Layout;
