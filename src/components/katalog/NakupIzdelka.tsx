"use client";

import { useState } from "react";
import { LuInfo, LuPhone, LuShoppingBag } from "react-icons/lu";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Price } from "@/components/ui/Price";
import { QuantityInput } from "@/components/ui/QuantityInput";
import { RadioCard, RadioGroup } from "@/components/ui/RadioGroup";
import { useToast } from "@/components/ui/Toast";
import type { Razpolozljivost } from "@/katalog/razpolozljivost";
import { formatirajCeno } from "@/lib/denar";
import { KOS, stevilo } from "@/lib/sklanjanje";

/** Največja količina ene velikosti v eni postavki (Z15). */
export const NAJVEC_KOSOV = 20;

export interface VelikostZaNakup {
  id: string;
  oznaka: string;
  cenaCenti: number | null;
  zaloga: number;
  razpolozljivost: Razpolozljivost;
}

function Obvestilo({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-3 rounded-lg bg-info-soft p-4 type-small text-info">
      <LuInfo aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
      <div className="flex flex-col gap-1">{children}</div>
    </div>
  );
}

/**
 * Izbira velikosti, količine in „V košarico“ (Z15). Razpoložljivost je
 * izračunana na strežniku (Z13); nenaročljive velikosti so vidne, a jih ni
 * mogoče izbrati. Izdelek `samo-prikaz` gumba nima (S14), zaprta trgovina
 * ga zamenja z obvestilom (Z27).
 *
 * Košarico doda K6; do takrat gumb pokaže obvestilo s telefonom.
 */
export function NakupIzdelka({
  ime,
  samoPrikaz,
  velikosti,
  trgovinaOdprta,
  telefon,
  telefonPovezava,
}: {
  ime: string;
  samoPrikaz: boolean;
  velikosti: VelikostZaNakup[];
  trgovinaOdprta: boolean;
  telefon: string | null;
  telefonPovezava: string | null;
}) {
  const { toast } = useToast();
  const narocljive = velikosti.filter((v) => v.razpolozljivost.narocljiva);
  const [izbranaId, setIzbranaId] = useState<string | undefined>(narocljive[0]?.id);
  const [kolicina, setKolicina] = useState(1);
  const izbrana = narocljive.find((v) => v.id === izbranaId);
  const najvec = izbrana ? Math.max(1, Math.min(izbrana.zaloga, NAJVEC_KOSOV)) : 1;

  const klic =
    telefon && telefonPovezava ? (
      <a href={telefonPovezava} className="font-semibold underline underline-offset-4">
        {telefon}
      </a>
    ) : null;

  if (samoPrikaz) {
    return (
      <Obvestilo>
        <p className="font-semibold">Na voljo na kmetiji</p>
        <p>
          {ime} prodajamo samo na kmetiji, ko je sezona. {klic && <>Pokličite nas na {klic}, povemo vam, kdaj pridete.</>}
        </p>
      </Obvestilo>
    );
  }

  const dodaj = () => {
    if (!izbrana) return;
    toast({
      variant: "info",
      title: "Spletna košarica bo kmalu na voljo",
      description: telefon
        ? `Do takrat ${ime.toLowerCase()} (${izbrana.oznaka}, ${kolicina}×) naročite po telefonu ${telefon}.`
        : "Do takrat nas za naročilo pokličite.",
    });
  };

  return (
    <form
      className="flex flex-col gap-6"
      onSubmit={(e) => {
        e.preventDefault();
        dodaj();
      }}
    >
      <Field label="Velikost" group>
        <RadioGroup
          value={izbranaId}
          onValueChange={(id) => {
            setIzbranaId(id);
            setKolicina(1);
          }}
        >
          {velikosti.map((v) => (
            <RadioCard
              key={v.id}
              value={v.id}
              disabled={!v.razpolozljivost.narocljiva}
              title={v.oznaka}
              description={v.razpolozljivost.oznaka}
              aside={v.cenaCenti != null ? formatirajCeno(v.cenaCenti) : undefined}
            />
          ))}
        </RadioGroup>
      </Field>

      {!trgovinaOdprta ? (
        <Obvestilo>
          <p className="font-semibold">Spletna trgovina je trenutno zaprta</p>
          <p>Katalog si lahko ogledate, naročila pa ta čas sprejemamo le po telefonu{klic && <> na {klic}</>}.</p>
        </Obvestilo>
      ) : izbrana ? (
        <>
          <Field label="Količina" description={`Največ ${stevilo(najvec, KOS)} v eni postavki.`}>
            <QuantityInput value={kolicina} onChange={setKolicina} min={1} max={najvec} />
          </Field>
          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-line pt-5">
            {izbrana.cenaCenti != null && (
              <p className="flex items-baseline gap-2">
                <span className="type-small text-ink-muted">Skupaj</span>
                <Price cents={izbrana.cenaCenti * kolicina} size="lg" />
              </p>
            )}
            <Button type="submit" size="lg">
              <LuShoppingBag aria-hidden="true" />V košarico
            </Button>
          </div>
        </>
      ) : (
        <Obvestilo>
          <p className="font-semibold">Trenutno ni na voljo za naročilo</p>
          {klic && (
            <p className="inline-flex items-center gap-1.5">
              <LuPhone aria-hidden="true" className="size-4" />
              Vprašajte nas na {klic}.
            </p>
          )}
        </Obvestilo>
      )}
    </form>
  );
}
