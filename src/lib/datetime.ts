export function formatDateTime(dt: Date | Temporal.PlainDate) {
  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(dt);
}
