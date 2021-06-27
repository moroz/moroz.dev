import React, { ReactNode } from "react";
import Head from "next/head";
import Header from "./Header";
import Footer from "./Footer";

type Props = {
  children?: ReactNode;
  title?: string;
  className?: string;
};

const Layout = ({ children, title, className }: Props) => (
  <div className={`layout ${className || ""}`}>
    <Head>
      <title>
        {title ? `${title.toLowerCase()} | moroz.dev` : "moroz.dev"}
      </title>
      <meta charSet="utf-8" />
      <meta name="viewport" content="initial-scale=1.0, width=device-width" />
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link
        rel="preconnect"
        href="https://fonts.gstatic.com"
        crossOrigin="crossorigin"
      />
      <link
        href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600&display=swap"
        rel="stylesheet"
      />
      <link rel="icon" href="/favicon.svg" />
      <meta name="theme-color" content="#ffb3b3" />
    </Head>
    <Header />
    <main role="main" id="main">
      {children}
    </main>
    <Footer />
  </div>
);

export default Layout;
