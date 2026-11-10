import { jeStatus, OZNAKE_STATUSOV } from "@/narocila/statusi";

/** Barvna značka statusa v seznamu naročil (`admin.components.Cell`). */
export function ZnackaStatusa({ cellData }: { cellData?: unknown }) {
  if (!jeStatus(cellData)) return null;
  return <span className={`teslan-znacka teslan-znacka--${cellData}`}>{OZNAKE_STATUSOV[cellData]}</span>;
}
