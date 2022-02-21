import Link from "next/link";
import Layout from "../layout/Layout";

const ContactPage = () => {
  return (
    <Layout title="Contact">
      <div className="container is-centered text-center">
        <h1 className="page-title mt-0">Get in touch!</h1>
        <p>
          Just drop me a line at{" "}
          <Link href="mailto:karol@moroz.dev">
            <a>karol@moroz.dev</a>
          </Link>{" "}
          if you have any questions regarding my work.
        </p>
      </div>
    </Layout>
  );
};

export default ContactPage;
