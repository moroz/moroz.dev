import clsx from "clsx";
import Link from "next/link";
import Layout from "../layout/Layout";
import styles from "./Landing.module.sass";

const IndexPage = () => (
  <Layout title="home" whiteHeader>
    <div className={styles.landing}>
      <div className={styles.hero}>
        <p>Hello world. My name is</p>
        <h1>Karol Moroz.</h1>
        <h2>I build modern Web applications.</h2>
        <div className={styles.description}>
          <p>I am a software developer based in Poznań, Poland.</p>
        </div>
        <Link href="/contact" className={clsx(styles.cta, "button")}>
          Get in touch
        </Link>
      </div>
      <picture>
        <source
          media="(max-width: 599px)"
          type="image/webp"
          srcSet="/km-half.webp"
        />
        <source
          media="(max-width: 599px)"
          type="image/png"
          srcSet="/km-half.png"
        />
        <source
          media="(min-width: 600px)"
          type="image/webp"
          srcSet="/km.webp"
        />
        <source media="(min-width: 600px)" type="image/png" srcSet="/km.png" />
        <img src="/km.png" alt="Karol Moroz" className={styles.human} />
      </picture>
    </div>
  </Layout>
);

export default IndexPage;
