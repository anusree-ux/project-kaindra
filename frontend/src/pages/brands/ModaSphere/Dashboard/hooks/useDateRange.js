import { useState } from "react";

const formatDate = (date) =>
  date.toISOString().split("T")[0];

const useDateRange = () => {
  const today = new Date();

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(today.getDate() - 30);

  const [startDate, setStartDate] = useState(
    formatDate(thirtyDaysAgo)
  );

  const [endDate, setEndDate] = useState(
    formatDate(today)
  );

  return {
    startDate,
    endDate,
    setStartDate,
    setEndDate,
  };
};

export default useDateRange;