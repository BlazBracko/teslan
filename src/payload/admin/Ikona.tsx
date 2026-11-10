import Image from "next/image";

/** Mala ikona v glavi admina (`admin.components.graphics.Icon`). */
export function Ikona() {
  return <Image src="/logo.png" alt="Domačija Tešlan" width={28} height={28} className="teslan-ikona" />;
}
