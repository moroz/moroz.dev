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
};

const description = `Learn Web development with Karol Moroz. Programming tips & tricks, Elixir, React, Svelte, TypeScript learning resources, blog, videos, and more.`;

const Layout = ({ children, title, className }: Props) => {
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
    <div className={`layout ${className || ""} ${classes}`}>
      <Head>
        <title>
          {title ? `${title.toLowerCase()} | moroz.dev` : "moroz.dev"}
        </title>
        <meta charSet="utf-8" />
        <meta name="viewport" content="initial-scale=1.0, width=device-width" />
        <meta name="description" content={description} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="crossorigin"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Merriweather+Sans:wght@400;700&display=swap"
          rel="stylesheet"
        />
        <link rel="icon" href="/favicon.svg" />
        <meta name="theme-color" content="#131723" />
      </Head>
      <Header />
      <main role="main" id="main">
        {children}
      </main>
      <Footer />
    </div>
  );
};

export default Layout;
