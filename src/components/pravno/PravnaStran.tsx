import Link from "next/link";
import { connection } from "next/server";
import { LuFileWarning } from "react-icons/lu";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/PageHeader";
import { okolje } from "@/env";
import type { PravniPodatkiProdajalca, Vrednost } from "@/pravno/prodajalec";

/** Razred za povezave v besedilu pravnih strani. */
export const povezavaBesedila = "rounded-xs font-medium text-brand underline underline-offset-4";

/**
 * Okvir pravne strani (Z61): glava, na stagingu (`NOINDEX=1`) obvestilo
 * „Osnutek – v pregledu“, kazalo poglavij in berljiva širina besedila.
 */
export async function PravnaStran({
  naslov,
  opis,
  posodobljeno,
  kazalo,
  children,
}: {
  naslov: string;
  opis: string;
  /** Npr. „november 2026“. */
  posodobljeno: string;
  /** Poglavja za kazalo (id sidra, naslov). */
  kazalo?: { id: string; naslov: string }[];
  children: React.ReactNode;
}) {
  // Okolje beremo ob zahtevi: ista gradnja teče na stagingu in v produkciji.
  await connection();
  const osnutek = okolje().NOINDEX === "1";

  return (
    <>
      <PageHeader label="Pravni dokumenti" title={naslov} description={opis} />
      <Container size="prose" className="flex flex-col gap-10 py-12 md:py-16">
        {osnutek && (
          <div
            role="note"
            className="flex gap-3 rounded-lg bg-warning-soft p-4 type-small text-warning ring-1 ring-warning/30"
          >
            <LuFileWarning aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
            <p>
              <strong className="font-semibold">Osnutek – v pregledu.</strong> Besedilo še ni pravno pregledano in se
              lahko spremeni pred objavo trgovine.
            </p>
          </div>
        )}

        {kazalo && kazalo.length > 0 && (
          <nav aria-label="Kazalo" className="rounded-lg bg-surface p-5 ring-1 ring-line">
            <h2 className="type-label text-ink-muted">Kazalo</h2>
            <ol className="mt-3 flex flex-col gap-1.5 type-small">
              {kazalo.map((p) => (
                <li key={p.id}>
                  <Link href={`#${p.id}`} className="rounded-xs text-brand underline-offset-4 hover:underline">
                    {p.naslov}
                  </Link>
                </li>
              ))}
            </ol>
          </nav>
        )}

        {children}

        <p className="type-small text-ink-subtle">Zadnja posodobitev: {posodobljeno}</p>
      </Container>
    </>
  );
}

/** Poglavje pravne strani s sidrom za kazalo. */
export function Poglavje({ id, naslov, children }: { id: string; naslov: string; children: React.ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-naslov`} className="flex scroll-mt-24 flex-col gap-3">
      <h2 id={`${id}-naslov`} className="type-h3 text-ink">
        {naslov}
      </h2>
      <div className="flex flex-col gap-3 type-body text-ink-muted [&_li]:mt-1 [&_ol]:list-decimal [&_ol]:pl-5 [&_ul]:list-disc [&_ul]:pl-5">
        {children}
      </div>
    </section>
  );
}

/** Podatek prodajalca ali vidna oznaka `[manjka: …]` (načrt §7). */
export function Podatek({ v }: { v: Vrednost }) {
  if (v.vpisano) return <>{v.besedilo}</>;
  return <mark className="rounded-xs bg-warning-soft px-1 text-warning">[manjka: {v.manjka}]</mark>;
}

/** E-naslov prodajalca kot povezava ali oznaka manjkajočega. */
export function EpostaProdajalca({ p }: { p: PravniPodatkiProdajalca }) {
  if (!p.email.vpisano) return <Podatek v={p.email} />;
  return (
    <a href={`mailto:${p.email.besedilo}`} className={povezavaBesedila}>
      {p.email.besedilo}
    </a>
  );
}

/** Blok s podatki prodajalca (upravljavca) na pravnih straneh. */
export function PodatkiProdajalca({ p, telefonPovezava }: { p: PravniPodatkiProdajalca; telefonPovezava: string | null }) {
  return (
    <address
      aria-label="Podatki prodajalca"
      className="flex flex-col gap-1 rounded-lg bg-surface p-5 not-italic ring-1 ring-line"
    >
      <span className="font-semibold text-ink">
        <Podatek v={p.naziv} />
      </span>
      <span>
        <Podatek v={p.naslov} />
      </span>
      <span>
        Davčna številka: <Podatek v={p.davcnaStevilka} />
      </span>
      {p.maticnaStevilka && <span>Matična številka: {p.maticnaStevilka}</span>}
      <span>
        KMG-MID: <Podatek v={p.kmgMid} />
      </span>
      <span>
        Telefon:{" "}
        {p.telefon.vpisano && telefonPovezava ? (
          <a href={telefonPovezava} className={povezavaBesedila}>
            {p.telefon.besedilo}
          </a>
        ) : (
          <Podatek v={p.telefon} />
        )}
      </span>
      <span>
        E-pošta: <EpostaProdajalca p={p} />
      </span>
    </address>
  );
}
