import Image from "next/image";

/** Logotip na prijavi in ob prvem zagonu (`admin.components.graphics.Logo`). */
export function Logotip() {
  return (
    <div className="teslan-logotip">
      <Image src="/logo.png" alt="" width={72} height={72} priority />
      <div>
        <p className="teslan-logotip__ime">Domačija Tešlan</p>
        <p className="teslan-logotip__podnaslov">Urejanje spletne trgovine</p>
      </div>
    </div>
  );
}
