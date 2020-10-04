import Link from "next/link";
import Layout from "../components/Layout";

const IndexPage = () => (
  <Layout title="Home | Next.js + TypeScript Example">
    <div className="landing">
      <div className="landing__hero">
        <h1>Hello world.</h1>
        <p>My name is Karol Moroz.</p>
        <p>
          I am a freelance software developer based in Kaohsiung, Taiwan,
          specializing in Web application development using Elixir and React.js.
        </p>
      </div>
    </div>
  </Layout>
);

export default IndexPage;
