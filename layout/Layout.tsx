import React, { ReactNode } from "react";
import Head from "next/head";
import Header from "./Header";
import Footer from "./Footer";

type Props = {
  children?: ReactNode;
  title?: string;
};

const Layout = ({ children, title }: Props) => (
  <div>
    <Head>
      <title>
        {title ? `${title.toLowerCase()} | moroz.dev` : "moroz.dev"}
      </title>
      <meta charSet="utf-8" />
      <meta name="viewport" content="initial-scale=1.0, width=device-width" />
      <link
        href="https://fonts.googleapis.com/css2?family=Quicksand:wght@400;500;700&display=swap"
        rel="stylesheet"
      />
      {/* <link
        href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
        rel="stylesheet"
      /> */}
    </Head>
    <Header />
    {children}
    <Footer />
  </div>
);

export default Layout;
