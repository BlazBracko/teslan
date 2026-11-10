import Link from "next/link";
import { LuArrowRight, LuGift, LuMessageSquareHeart, LuSparkles, LuTruck } from "react-icons/lu";
import { KarticaPrograma } from "@/components/darila/KarticaPrograma";
import { PoslovnaDarila } from "@/components/darila/PoslovnaDarila";
import { POT_DARIL, POT_KONFIGURATORJA } from "@/components/postavitev/navigacija";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import type { ProgramZaPrikaz } from "@/darila/predstavitev";
import type { Kontakt } from "@/lib/kontakt";

const PREDNOSTI = [
  { ikona: LuGift, besedilo: "Pripravljene škatle ali škatla, ki jo sestavite sami" },
  { ikona: LuMessageSquareHeart, besedilo: "Vaše sporočilo na kartici v škatli" },
  { ikona: LuTruck, besedilo: "Pošljemo po pošti, tudi neposredno obdarovancu" },
];

/**
 * Darilni program na domači strani, takoj pod uvodom. V novembru in
 * decembru je prazničen (božič, novo leto, poslovna darila), sicer
 * splošen. Temna ploskev s svetlimi karticami, da izstopa od ostale strani.
 */
export function DarilniProgram({
  programi,
  kontakt,
  praznicno,
  leto,
}: {
  programi: ProgramZaPrikaz[];
  kontakt: Kontakt;
  praznicno: boolean;
  leto: number;
}) {
  const prikazani = programi.slice(0, 2);
  return (
    <section aria-labelledby="darila-naslov" className="relative isolate overflow-hidden bg-surface-inverse text-ink-inverse">
      {/* Okras: nekaj svetlečih zvezdic, brez pomena za bralnik zaslona. */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 text-ink-inverse/8">
        <LuSparkles className="absolute -top-6 right-[8%] size-40 rotate-12" />
        <LuSparkles className="absolute bottom-10 left-[3%] size-24 -rotate-12" />
        <LuGift className="absolute -bottom-10 right-[38%] size-56 -rotate-6" />
      </div>

      <Container className="grid gap-10 py-section lg:grid-cols-12 lg:gap-14 lg:py-section-lg">
        <div className="flex flex-col items-start gap-6 lg:col-span-5">
          <p className="inline-flex items-center gap-2 rounded-full bg-ink-inverse/10 px-3 py-1.5 type-label text-ink-inverse">
            <LuSparkles aria-hidden="true" className="size-4" />
            {praznicno ? `Darilni program · prazniki ${leto}` : "Darilni program"}
          </p>
          <h2 id="darila-naslov" className="type-h2 text-ink-inverse">
            {praznicno ? (
              <>
                Za praznike podarite <span className="italic">okus domačega</span>
              </>
            ) : (
              <>
                Podarite <span className="italic">okus domačega</span>
              </>
            )}
          </h2>
          <p className="type-body-lg text-ink-inverse-muted">
            {praznicno
              ? "Darilne škatle z našimi izdelki za božič in novo leto: za družino, prijatelje, sodelavce in poslovne partnerje. Naročite pravočasno, da darilo pride pred prazniki."
              : "Darilne škatle z našimi izdelki za rojstne dneve, zahvale in obiske. Izberite pripravljeno darilo ali sestavite svoje."}
          </p>
          <ul className="flex flex-col gap-3">
            {PREDNOSTI.map(({ ikona: Ikona, besedilo }) => (
              <li key={besedilo} className="flex items-center gap-3 type-body text-ink-inverse">
                <span className="grid size-9 shrink-0 place-items-center rounded-full bg-ink-inverse/10">
                  <Ikona aria-hidden="true" className="size-4.5" />
                </span>
                {besedilo}
              </li>
            ))}
          </ul>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3 pt-2">
            <Button asChild size="lg" variant="secondary">
              <Link href={POT_DARIL}>
                Izberite darilo
                <LuArrowRight aria-hidden="true" />
              </Link>
            </Button>
            <Link
              href={POT_KONFIGURATORJA}
              className="inline-flex min-h-11 items-center gap-2 rounded-xs type-body font-medium text-ink-inverse underline decoration-ink-inverse/40 underline-offset-4 hover:decoration-ink-inverse focus-visible:outline-ink-inverse"
            >
              Sestavite svojo škatlo
            </Link>
          </div>
        </div>

        <div className="flex flex-col gap-5 lg:col-span-7">
          {prikazani.length > 0 && (
            <ul className="grid gap-5 sm:grid-cols-2">
              {prikazani.map((p) => (
                <li key={p.id}>
                  <KarticaPrograma program={p} />
                </li>
              ))}
            </ul>
          )}
          <PoslovnaDarila kontakt={kontakt} temno />
        </div>
      </Container>
    </section>
  );
}
