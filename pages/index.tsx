import Link from "next/link";
import Layout from "../layout/Layout";

const IndexPage = () => (
  <Layout title="home">
    <div className="landing">
      <div className="landing__hero">
        <p>Hello world. My name is</p>
        <h1>Karol Moroz.</h1>
        <h2>I build modern Web applications.</h2>
        <div className="landing__description">
          <p>
            I am a software developer from Poland, currently living in
            Kaohsiung,&nbsp;Taiwan (that&apos;s the city in the background).
          </p>
        </div>
        <Link href="/contact">
          <a className="button landing__cta">Get in touch</a>
        </Link>
      </div>
      <img src="/km.png" alt="Karol Moroz" className="landing__human" />
    </div>
  </Layout>
);

export default IndexPage;
