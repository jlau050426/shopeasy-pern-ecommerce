import { Link } from "react-router-dom";
import "./pagination.css";

export function generatePagination(totalPages, currentPage) {
  const pages = [];

  for (let page = 1; page <= totalPages; page++) {
    const isCurrent = Number(page) === Number(currentPage)
    pages.push(
      <Link
        key={page}
        to={`/?page=${page}`}
        className={isCurrent ? "active" : ""}
      >
        {page}
      </Link>,
    );
  }

  return <div>{pages}</div>;
}
