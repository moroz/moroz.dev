import Link from "next/link";
import Layout from "../layout/Layout";

const IndexPage = () => (
  <Layout title="home" className="layout--white-header">
    <div className="landing">
      <div className="landing__hero">
        <p>Hello world. My name is</p>
        <h1>Karol Moroz.</h1>
        <h2>I build modern Web applications.</h2>
        <div className="landing__description">
          <p>I am a software developer based in Warsaw, Poland.</p>
        </div>
        <Link href="/contact">
          <a className="button landing__cta">Get in touch</a>
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
        <img src="/km.png" alt="Karol Moroz" className="landing__human" />
      </picture>
    </div>
  </Layout>
);

export default IndexPage;
