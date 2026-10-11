const FORBIDDEN_CHARS = /[\\/:*?"<>|\x00-\x1f]/g;
const MAX_LENGTH = 100;

export function toFileName(value: string | null | undefined, fallback: string): string {
  const cleaned = (value ?? "")
    .replace(FORBIDDEN_CHARS, "-")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, MAX_LENGTH)
    .replace(/[. ]+$/, "");

  return cleaned || fallback;
}
