import { LuStore } from "react-icons/lu";
import { Badge, type BadgeProps } from "@/components/ui/Badge";
import type { NacinProdaje, Razpolozljivost, VrstaRazpolozljivosti } from "@/katalog/razpolozljivost";
import { oznakaNacinaProdaje } from "@/katalog/razpolozljivost";

/**
 * Oznake razpoložljivosti (Z13). Pomen nosi besedilo, barva ga le podpre.
 * „Izven sezone“ in „Ni na zalogi“ sta nevtralni, ne rdeči: šparglji
 * novembra niso napaka, ampak letni čas.
 */
const barva: Record<VrstaRazpolozljivosti, BadgeProps["variant"]> = {
  "na-zalogi": "success",
  malo: "warning",
  "ni-na-zalogi": "neutral",
  kmalu: "accent",
  "izven-sezone": "neutral",
  "na-kmetiji": "brand",
};

export function OznakaRazpolozljivosti({ razpolozljivost }: { razpolozljivost: Razpolozljivost }) {
  return (
    <Badge variant={barva[razpolozljivost.vrsta]} dot>
      {razpolozljivost.oznaka}
    </Badge>
  );
}

/** „Samo prevzem na kmetiji“ (Z13) za izdelke, ki se ne pošiljajo. */
export function OznakaNacina({ nacin }: { nacin: NacinProdaje }) {
  const oznaka = oznakaNacinaProdaje(nacin);
  if (!oznaka) return null;
  return (
    <Badge variant="outline">
      <LuStore aria-hidden="true" />
      {oznaka}
    </Badge>
  );
}
