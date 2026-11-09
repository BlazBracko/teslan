/**
 * Slug za spletni naslov (npr. `/products/cesen-v-prahu`): male črke brez
 * šumnikov, besede ločene z vezajem.
 */
export const OBLIKA_SLUGA = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function ustvariSlug(besedilo: string): string {
  return besedilo
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
