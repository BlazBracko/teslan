"use client";

import { useEffect } from "react";
import { izprazniKosarico } from "@/kosarica/shramba";

/**
 * Izprazni košarico, ko se kupec vrne s plačila na potrdilo naročila (T3
 * korak 3). Pred plačilom košarica ostane, da jo ima kupec ob prekinitvi
 * plačila še vedno (T3 korak 4).
 */
export function IzprazniKosarico() {
  useEffect(() => {
    izprazniKosarico();
  }, []);
  return null;
}
