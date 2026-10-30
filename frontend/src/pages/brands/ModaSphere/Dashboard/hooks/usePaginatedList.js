import { useMemo, useState } from "react";

const usePaginatedList = (items = [], pageSize = 10) => {
  const [page, setPage] = useState(1);

  const totalPages = Math.max(
    1,
    Math.ceil(items.length / pageSize)
  );

  const paginatedItems = useMemo(() => {
    const start = (page - 1) * pageSize;

    return items.slice(start, start + pageSize);
  }, [items, page, pageSize]);

  const nextPage = () => {
    setPage((current) =>
      Math.min(current + 1, totalPages)
    );
  };

  const previousPage = () => {
    setPage((current) =>
      Math.max(current - 1, 1)
    );
  };

  return {
    page,
    setPage,
    totalPages,
    paginatedItems,
    nextPage,
    previousPage,
  };
};

export default usePaginatedList;