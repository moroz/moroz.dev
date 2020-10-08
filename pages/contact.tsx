import Link from "next/link";
import Layout from "../layout/Layout";

const ContactPage = () => {
  return (
    <Layout title="Contact">
      <div className="container is-centered text-center">
        <h1 className="page-title mt-0">Get in touch!</h1>
        <p>
          Just drop me a line at{" "}
          <Link href="mailto:k.j.moroz@gmail.com">
            <a>k.j.moroz@gmail.com</a>
          </Link>{" "}
          to get a quote or if you have any questions regarding my projects or
          videos.
        </p>
      </div>
    </Layout>
  );
};

export default ContactPage;
