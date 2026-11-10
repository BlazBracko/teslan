"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LuCircleHelp, LuExternalLink, LuHouse } from "react-icons/lu";

/**
 * Dodatne povezave v stranskem meniju admina: nadzorna plošča na vrhu
 * (`beforeNavLinks`), pomoč in javna stran na dnu (`afterNavLinks`).
 * Videz je enak Payloadovim povezavam (razreda `nav__link`).
 */
function Povezava({ href, children, ikona }: { href: string; children: React.ReactNode; ikona: React.ReactNode }) {
  const pot = usePathname();
  const aktivna = pot === href;
  return (
    <Link href={href} className="nav__link teslan-nav-povezava" aria-current={aktivna ? "page" : undefined}>
      {aktivna ? <div className="nav__link-indicator" /> : null}
      {ikona}
      <span className="nav__link-label">{children}</span>
    </Link>
  );
}

export function PovezaveNaVrhu() {
  return (
    <div className="teslan-nav-skupina">
      <Povezava href="/admin" ikona={<LuHouse aria-hidden />}>
        Nadzorna plošča
      </Povezava>
    </div>
  );
}

export function PovezaveNaDnu() {
  return (
    <div className="teslan-nav-skupina teslan-nav-skupina--dno">
      <Povezava href="/admin/pomoc" ikona={<LuCircleHelp aria-hidden />}>
        Pomoč
      </Povezava>
      <a href="/" target="_blank" rel="noreferrer" className="nav__link teslan-nav-povezava">
        <LuExternalLink aria-hidden />
        <span className="nav__link-label">
          Odpri spletno stran<span className="teslan-skrito"> (odpre se v novem zavihku)</span>
        </span>
      </a>
    </div>
  );
}
