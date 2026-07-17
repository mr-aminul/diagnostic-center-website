import type { LocalizedText } from "@/config/site";

export function localizedFromForm(
  formData: FormData,
  enKey: string,
  bnKey: string,
): LocalizedText {
  return {
    en: String(formData.get(enKey) ?? "").trim(),
    bn: String(formData.get(bnKey) ?? "").trim(),
  };
}

export function checkboxOn(formData: FormData, key: string): boolean {
  const value = formData.get(key);
  return value === "on" || value === "true" || value === "1";
}

export function csvLines(value: string): string[] {
  return value
    .split(/[\n,]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}
