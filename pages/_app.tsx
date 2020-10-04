import type { AppProps } from "next/app";
import "../css/app.sass";

function MyApp({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />;
}

export default MyApp;
