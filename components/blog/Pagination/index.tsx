import React from "react";
import Link from "next/link";
import styles from "./Pagination.module.sass";
import clsx from "clsx";

interface Props {
  pageCount: number;
  currentPage: number;
}

const hrefForPage = (page: number) => {
  if (page === 1) return "/blog";
  return `/blog/page/${page}`;
};

const Pagination: React.FC<Props> = ({ pageCount, currentPage }) => {
  if (pageCount < 2) return null;

  return (
    <div className="container">
      <ul className={styles.pagination}>
        {currentPage > 1 ? (
          <Link
            href={hrefForPage(currentPage - 1)}
            className={styles.newer}
            title="Newer posts"
          >
            Newer
          </Link>
        ) : null}
        {new Array(pageCount).fill(null).map((_, i) => {
          const href = i === 0 ? "/blog" : `/blog/page/${i + 1}`;
          if (i + 1 === currentPage) {
            return (
              <li className={clsx(styles.page, styles.current)} key={i}>
                {currentPage}
              </li>
            );
          }

          return (
            <Link
              href={href}
              key={i}
              className={styles.page}
              title={`Go to page ${i + 1}`}
            >
              {i + 1}
            </Link>
          );
        })}
        {currentPage < pageCount ? (
          <Link
            href={hrefForPage(currentPage + 1)}
            className={styles.older}
            title="Older posts"
          >
            Older
          </Link>
        ) : null}
      </ul>
    </div>
  );
};

export default Pagination;
