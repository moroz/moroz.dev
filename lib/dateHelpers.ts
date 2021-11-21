import dayjs from "dayjs";

export function formatDate(date: string) {
  return dayjs(date).format("MMMM D, YYYY");
}

export function formatDateTime(date: string) {
  return dayjs(date).format("MMM D, YYYY, HH:mm:ss");
}
