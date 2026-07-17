export const LINE_DISCOUNT_PREFIX = "__line:";

export function lineDiscountNote(itemId: string) {
  return `${LINE_DISCOUNT_PREFIX}${itemId}`;
}

export function parseLineDiscountItemId(note: string | null | undefined) {
  if (!note?.startsWith(LINE_DISCOUNT_PREFIX)) return null;
  return note.slice(LINE_DISCOUNT_PREFIX.length) || null;
}
