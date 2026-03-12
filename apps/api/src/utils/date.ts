import dayjs from "dayjs";

export const getDayRange = (date = new Date()) => {
  const target = dayjs(date);

  return {
    start: target.startOf("day").toDate(),
    end: target.endOf("day").toDate()
  };
};
