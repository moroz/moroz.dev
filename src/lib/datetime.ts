const parts = new Intl.DateTimeFormat("en", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

const suffixes = { one: "st", two: "nd", few: "rd", other: "th" } as const;
const ordinal = new Intl.PluralRules("en", { type: "ordinal" });

// "1st Nov., 2025"; May is not abbreviated, so it takes no full stop.
export function formatDateTime(dt: Date | Temporal.PlainDate) {
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.formatToParts(dt).find((p) => p.type === type)!.value;
  const day = Number(part("day"));
  const month = part("month");
  const suffix = suffixes[ordinal.select(day) as keyof typeof suffixes];
  return `${day}${suffix} ${month}${month === "May" ? "" : "."}, ${part("year")}`;
}
