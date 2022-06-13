import styles from "./Footer.module.sass";

const Footer = () => {
  return (
    <footer className={styles.footer}>
      <p>&copy; 2020-2022 by Karol Moroz.</p>
      <small>
        The source code of this website is available on{" "}
        <a
          href="https://github.com/moroz/moroz.dev"
          target="_blank"
          rel="noopener noreferer"
        >
          Github
        </a>
        .
      </small>
    </footer>
  );
};

export default Footer;
