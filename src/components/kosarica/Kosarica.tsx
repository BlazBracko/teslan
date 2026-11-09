"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { LuCircleAlert, LuInfo, LuRefreshCw, LuShoppingBag, LuTrash2, LuTruck } from "react-icons/lu";
import { SlikaIzdelka } from "@/components/katalog/SlikaIzdelka";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Field } from "@/components/ui/Field";
import { Price } from "@/components/ui/Price";
import { QuantityInput } from "@/components/ui/QuantityInput";
import { POT_BLAGAJNE } from "@/components/postavitev/navigacija";
import { Skeleton } from "@/components/ui/Skeleton";
import { preveriKosaricoNaStrezniku } from "@/kosarica/akcije";
import { oznakaStopnje } from "@/kosarica/cene";
import { nastevanje } from "@/kosarica/dostava";
import { kljucPostavke, type PostavkaKosarice } from "@/kosarica/postavke";
import type { PostavkaPregled, PregledKosarice } from "@/kosarica/preverjanje";
import { nastaviKolicinoVKosarici, odstraniIzKosarice, useKosarica } from "@/kosarica/shramba";
import { formatirajCeno } from "@/lib/denar";
import { KOS, stevilo } from "@/lib/sklanjanje";
import { cn } from "@/lib/utils";

/** Zamik, preden se košarica po spremembi znova preveri (tipkanje količine). */
const ZAMIK_PREVERJANJA_MS = 150;

/**
 * Vsebina strani košarice (Z20, Z21, Z22, T2 korak 2, T4). Košarica je v
 * brskalniku, strežnik ob vsaki spremembi izračuna cene, zalogo in pravila
 * dostave. Postavke s težavo so označene z razlogom; na blagajno se ne da,
 * dokler jih kupec ne odstrani ali popravi.
 *
 * Nakupni tok je brez okrasnih animacij (Z2).
 */
export function Kosarica({ telefon, telefonPovezava }: { telefon: string | null; telefonPovezava: string | null }) {
  const kosarica = useKosarica();
  const [rezultat, setRezultat] = useState<{ za: PostavkaKosarice[]; pregled: PregledKosarice } | null>(null);
  const [napakaZa, setNapakaZa] = useState<PostavkaKosarice[] | null>(null);
  const [poskus, setPoskus] = useState(0);

  useEffect(() => {
    if (!kosarica || kosarica.length === 0) return;
    let preklicano = false;
    const casovnik = setTimeout(() => {
      preveriKosaricoNaStrezniku(kosarica).then(
        (pregled) => {
          if (preklicano) return;
          setRezultat({ za: kosarica, pregled });
          setNapakaZa(null);
        },
        () => {
          if (!preklicano) setNapakaZa(kosarica);
        },
      );
    }, ZAMIK_PREVERJANJA_MS);
    return () => {
      preklicano = true;
      clearTimeout(casovnik);
    };
  }, [kosarica, poskus]);

  if (kosarica === null) return <Nalaganje />;

  if (kosarica.length === 0) {
    return (
      <EmptyState
        icon={<LuShoppingBag aria-hidden="true" />}
        title="Vaša košarica je prazna"
        description="Izberite izdelke na ceniku in jih dodajte v košarico. Shranjena ostane v tem brskalniku."
        action={
          <Button asChild>
            <Link href="/products">Na izdelke</Link>
          </Button>
        }
      />
    );
  }

  if (napakaZa === kosarica) {
    return (
      <div role="alert" className="flex flex-col items-start gap-3 rounded-lg bg-danger-soft p-5 text-danger">
        <p className="flex items-center gap-2 type-body font-semibold">
          <LuCircleAlert aria-hidden="true" className="size-5" />
          Košarice ta hip ni mogoče preveriti
        </p>
        <p className="type-small">Vaši izdelki so še vedno shranjeni. Poskusite znova čez nekaj trenutkov.</p>
        <Button variant="secondary" size="sm" onClick={() => setPoskus((p) => p + 1)}>
          <LuRefreshCw aria-hidden="true" />
          Poskusi znova
        </Button>
      </div>
    );
  }

  if (!rezultat) return <Nalaganje />;

  const { pregled } = rezultat;
  const zastarelo = rezultat.za !== kosarica;
  const lokalno = new Map(kosarica.map((p) => [kljucPostavke(p), p]));
  const vrstice = pregled.postavke.filter((p) => lokalno.has(p.kljuc));

  return (
    <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-12">
      <section aria-labelledby="postavke-naslov" className="flex flex-col gap-4">
        <h2 id="postavke-naslov" className="sr-only">
          Izdelki v košarici
        </h2>
        {pregled.imaTezave && (
          <p className="flex gap-3 rounded-lg bg-warning-soft p-4 type-small text-warning" role="status">
            <LuCircleAlert aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
            Nekaterih izdelkov ni mogoče naročiti, kot so v košarici. Pri označenih postavkah preberite razlog ter
            jih odstranite ali popravite količino.
          </p>
        )}
        <ul className="flex flex-col divide-y divide-line border-y border-line">
          {vrstice.map((p) => (
            <Vrstica key={p.kljuc} postavka={p} kolicina={lokalno.get(p.kljuc)?.kolicina ?? p.kolicina} />
          ))}
        </ul>
      </section>

      <Povzetek
        pregled={pregled}
        zastarelo={zastarelo}
        telefon={telefon}
        telefonPovezava={telefonPovezava}
      />
    </div>
  );
}

function Nalaganje() {
  return (
    <div aria-busy="true" className="flex flex-col gap-4">
      <p className="sr-only" role="status">
        Nalagam košarico …
      </p>
      {[0, 1].map((i) => (
        <div key={i} className="flex gap-4 border-b border-line py-5">
          <Skeleton className="size-20 shrink-0 rounded-lg" />
          <div className="flex flex-1 flex-col gap-2">
            <Skeleton className="h-5 w-1/2" />
            <Skeleton className="h-4 w-1/3" />
          </div>
        </div>
      ))}
    </div>
  );
}

function Vrstica({ postavka: p, kolicina }: { postavka: PostavkaPregled; kolicina: number }) {
  const ime = p.izdelek?.ime ?? "Izdelek, ki ga ni več v ponudbi";
  const opis = p.velikost ? `${ime}, ${p.velikost}` : ime;
  const povezava = p.izdelek ? `/products/${p.izdelek.slug}` : null;
  const nedosegljivo = p.tezava?.vrsta === "nedosegljivo";
  const popravek = p.tezava?.vrsta === "kolicina" ? (p.tezava.najvecKosov ?? 0) : 0;

  return (
    <li className="flex gap-4 py-5" data-kljuc={p.kljuc}>
      <div className={cn("w-20 shrink-0 sm:w-24", nedosegljivo && "opacity-60")}>
        <SlikaIzdelka
          slika={p.izdelek?.slika}
          sizes="96px"
          className="aspect-square rounded-lg"
          nadomestnaOznaka={`${ime}: slika še ni na voljo`}
        />
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-3">
        <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1">
          <div className="flex min-w-0 flex-col gap-0.5">
            <h3 className="type-title text-ink">
              {povezava ? (
                <Link href={povezava} className="rounded-xs hover:underline">
                  {ime}
                </Link>
              ) : (
                ime
              )}
            </h3>
            {p.velikost && (
              <p className="type-small text-ink-muted">
                {p.velikost}
                {p.cenaCenti != null && <> · {formatirajCeno(p.cenaCenti)} / kos</>}
              </p>
            )}
          </div>
          {p.skupajCenti != null && !p.tezava && <Price cents={p.skupajCenti} />}
        </div>

        {p.tezava && (
          <p className="flex items-start gap-2 type-small font-medium text-danger">
            <LuCircleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
            <span>{p.tezava.razlog}</span>
          </p>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3">
          {nedosegljivo ? (
            <p className="type-small text-ink-muted">{stevilo(kolicina, KOS)}</p>
          ) : (
            <Field label={`Količina: ${opis}`} hideLabel>
              <QuantityInput
                value={kolicina}
                onChange={(v) => nastaviKolicinoVKosarici(p.kljuc, v)}
                min={1}
                max={Math.max(1, p.najvecKosov, kolicina)}
              />
            </Field>
          )}
          <div className="flex flex-wrap items-center gap-2">
            {popravek > 0 && (
              <Button variant="secondary" size="sm" onClick={() => nastaviKolicinoVKosarici(p.kljuc, popravek)}>
                Zmanjšaj na {popravek}
              </Button>
            )}
            <Button
              variant={nedosegljivo ? "secondary" : "ghost"}
              size="sm"
              onClick={() => odstraniIzKosarice(p.kljuc)}
              aria-label={`Odstrani iz košarice: ${opis}`}
            >
              <LuTrash2 aria-hidden="true" />
              Odstrani
            </Button>
          </div>
        </div>
      </div>
    </li>
  );
}

function Povzetek({
  pregled,
  zastarelo,
  telefon,
  telefonPovezava,
}: {
  pregled: PregledKosarice;
  zastarelo: boolean;
  telefon: string | null;
  telefonPovezava: string | null;
}) {
  const { dostava } = pregled;
  const klic =
    telefon && telefonPovezava ? (
      <a href={telefonPovezava} className="font-semibold underline underline-offset-4">
        {telefon}
      </a>
    ) : null;

  return (
    <section
      aria-labelledby="povzetek-naslov"
      aria-busy={zastarelo || undefined}
      className="flex flex-col gap-5 rounded-xl bg-surface p-6 shadow-raised ring-1 ring-line lg:sticky lg:top-24"
    >
      <h2 id="povzetek-naslov" className="type-h3 text-ink">
        Povzetek
      </h2>

      <dl className="flex flex-col gap-3 type-body">
        <div className="flex items-baseline justify-between gap-4">
          <dt className="text-ink-muted">
            Vmesni seštevek
            <span className="type-small"> ({stevilo(pregled.steviloKosov, KOS)})</span>
          </dt>
          <dd data-testid="vmesni-sestevek">
            <Price cents={pregled.vmesniSestevekCenti} />
          </dd>
        </div>
        {pregled.ddv.map((d) => (
          <div key={d.stopnja} className="flex items-baseline justify-between gap-4 type-small text-ink-muted">
            <dt>Vključen DDV {oznakaStopnje(d.stopnja)}</dt>
            <dd className="type-numeric">{formatirajCeno(d.ddvCenti)}</dd>
          </div>
        ))}
      </dl>

      <div className="flex flex-col gap-2 border-t border-line pt-5 type-small">
        <p className="flex items-center gap-2 font-semibold text-ink">
          <LuTruck aria-hidden="true" className="size-4" />
          Dostava
        </p>
        <p className="text-ink-muted">Prevzem na kmetiji: brezplačno.</p>
        {dostava.postaDovoljena ? (
          <p className="text-ink-muted" data-testid="posta">
            Pošta:{" "}
            {dostava.postninaCenti === 0
              ? "brezplačno."
              : `${formatirajCeno(dostava.postninaCenti)}, brezplačno od ${formatirajCeno(dostava.pragBrezplacnePostnineCenti)}.`}
            {dostava.doBrezplacnePostnineCenti > 0 && (
              <> Do brezplačne poštnine vam manjka {formatirajCeno(dostava.doBrezplacnePostnineCenti)}.</>
            )}
          </p>
        ) : (
          <p className="text-ink-muted" data-testid="posta">
            Pošiljanje po pošti ni mogoče, ker so v košarici izdelki samo za prevzem na kmetiji:{" "}
            {nastevanje(dostava.samoPrevzem)}.
          </p>
        )}
        <p className="text-ink-subtle">Način dostave in plačila izberete na blagajni.</p>
      </div>

      {!pregled.trgovinaOdprta ? (
        <Obvestilo naslov="Spletna trgovina je trenutno zaprta">
          Naročila ta čas sprejemamo le po telefonu{klic && <> na {klic}</>}. Košarica ostane shranjena.
        </Obvestilo>
      ) : (
        <div className="flex flex-col gap-3 border-t border-line pt-5">
          {pregled.lahkoNaBlagajno ? (
            <Button asChild size="lg" block>
              <Link href={POT_BLAGAJNE}>Na blagajno</Link>
            </Button>
          ) : (
            <>
              <Button size="lg" block disabled aria-describedby="blagajna-opis">
                Na blagajno
              </Button>
              <p id="blagajna-opis" className="type-small text-ink-muted">
                Pred nadaljevanjem uredite označene postavke.
              </p>
            </>
          )}
        </div>
      )}
    </section>
  );
}

function Obvestilo({ naslov, children }: { naslov: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-3 rounded-lg bg-info-soft p-4 type-small text-info">
      <LuInfo aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
      <div className="flex flex-col gap-1">
        <p className="font-semibold">{naslov}</p>
        <p>{children}</p>
      </div>
    </div>
  );
}
