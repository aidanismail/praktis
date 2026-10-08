const LOCALE = "en";

const dateFormatter = new Intl.DateTimeFormat(LOCALE, { dateStyle: "medium" });
const dateTimeFormatter = new Intl.DateTimeFormat(LOCALE, {
  dateStyle: "medium",
  timeStyle: "short"
});

function parse(value: string | null | undefined) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatDate(value: string | null | undefined, fallback = "Date unavailable") {
  const date = parse(value);
  return date ? dateFormatter.format(date) : fallback;
}

export function formatDateTime(value: string | null | undefined, fallback = "Date unavailable") {
  const date = parse(value);
  return date ? dateTimeFormatter.format(date) : fallback;
}

export function formatCalendarDate(value: string | null | undefined, fallback = "Date unavailable") {
  if (!value) return fallback;
  const date = new Date(`${value.slice(0, 10)}T00:00:00`);
  return Number.isNaN(date.getTime()) ? fallback : dateFormatter.format(date);
}

export function localDateKey(now: number | Date = Date.now()) {
  const date = typeof now === "number" ? new Date(now) : now;
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}
