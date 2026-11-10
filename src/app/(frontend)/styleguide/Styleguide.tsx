"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { LuArrowRight, LuMenu, LuPackage, LuShoppingBag, LuTrash2 } from "react-icons/lu";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardFooter, CardTitle, ImagePlaceholder } from "@/components/ui/Card";
import { Checkbox } from "@/components/ui/Checkbox";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/Dialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { Field } from "@/components/ui/Field";
import { Input, Textarea } from "@/components/ui/Input";
import { Price } from "@/components/ui/Price";
import { QuantityInput } from "@/components/ui/QuantityInput";
import { RadioCard, RadioGroup, RadioItem } from "@/components/ui/RadioGroup";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";
import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from "@/components/ui/Sheet";
import { Skeleton } from "@/components/ui/Skeleton";
import { Spinner } from "@/components/ui/Spinner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import { ToastProvider, useToast } from "@/components/ui/Toast";

const barve: Array<{ skupina: string; tokeni: Array<{ ime: string; opis: string; svetlo?: boolean }> }> = [
  {
    skupina: "Podlage in ploskve",
    tokeni: [
      { ime: "canvas", opis: "Podlaga strani" },
      { ime: "surface", opis: "Kartice, polja, plasti" },
      { ime: "surface-muted", opis: "Umirjena ploskev" },
      { ime: "surface-inverse", opis: "Temna ploskev (noga)", svetlo: true },
    ],
  },
  {
    skupina: "Besedilo in črte",
    tokeni: [
      { ime: "ink", opis: "Glavno besedilo", svetlo: true },
      { ime: "ink-muted", opis: "Drugotno besedilo", svetlo: true },
      { ime: "ink-subtle", opis: "Pripisi, nadomestno besedilo", svetlo: true },
      { ime: "line", opis: "Okrasna ločnica" },
      { ime: "line-strong", opis: "Rob kontrolnika (≥ 3 : 1)", svetlo: true },
    ],
  },
  {
    skupina: "Znamka in poudarek",
    tokeni: [
      { ime: "brand", opis: "Zelena njiv: glavna dejanja", svetlo: true },
      { ime: "brand-strong", opis: "Pritisk, lebdenje", svetlo: true },
      { ime: "brand-soft", opis: "Izbrano, oznake" },
      { ime: "brand-bright", opis: "Poudarek na temnih ploskvah" },
      { ime: "accent", opis: "Glina: sezona, izpostavljeno", svetlo: true },
      { ime: "accent-soft", opis: "Ozadje poudarka" },
    ],
  },
  {
    skupina: "Stanja",
    tokeni: [
      { ime: "success", opis: "Uspeh, na zalogi", svetlo: true },
      { ime: "warning", opis: "Opozorilo, malo zaloge", svetlo: true },
      { ime: "danger", opis: "Napaka, ni na zalogi", svetlo: true },
      { ime: "info", opis: "Informacija, kmalu", svetlo: true },
      { ime: "focus", opis: "Obroč fokusa", svetlo: true },
    ],
  },
];

const tipi = [
  { razred: "type-display", ime: "Display", primer: "Iz naše zemlje" },
  { razred: "type-h1", ime: "Naslov 1", primer: "Šparglji z Dolenjske" },
  { razred: "type-h2", ime: "Naslov 2", primer: "Sezonska ponudba" },
  { razred: "type-h3", ime: "Naslov 3", primer: "Česen v prahu" },
  { razred: "type-title", ime: "Naslov elementa", primer: "Prevzem na kmetiji" },
  { razred: "type-body-lg", ime: "Uvodno besedilo", primer: "Na domačiji v Podgori pridelujemo šparglje, jagode, česen in krompir." },
  { razred: "type-body", ime: "Besedilo", primer: "Vsak izdelek je pridelan in predelan doma, brez dodatkov. Žličko česna v prahu dodajte jedi na koncu kuhanja." },
  { razred: "type-small", ime: "Manjše besedilo", primer: "Cene vključujejo DDV." },
  { razred: "type-caption", ime: "Pripis", primer: "Zadnja posodobitev zaloge pred 5 minutami" },
  { razred: "type-label", ime: "Oznaka", primer: "Sveže iz sezone" },
];

export function Styleguide() {
  return (
    <ToastProvider>
      <div className="min-h-dvh bg-canvas pt-10 pb-section-lg text-ink-muted">
        <div className="mx-auto flex max-w-content flex-col gap-section px-gutter sm:px-gutter-lg">
          <header className="flex flex-col gap-3">
            <p className="type-label text-accent">Samo na stagingu</p>
            <h1 className="type-h1">Slogovni vodnik</h1>
            <p className="max-w-prose type-body-lg">
              Barve, pisave in komponente nove identitete Domačije Tešlan. Vse vrednosti so tokeni v{" "}
              <code className="rounded-xs bg-surface-muted px-1.5 py-0.5 type-small text-ink">globals.css</code>,
              komponente pa v{" "}
              <code className="rounded-xs bg-surface-muted px-1.5 py-0.5 type-small text-ink">src/components/ui</code>.
            </p>
          </header>

          <Barve />
          <Tipografija />
          <Oblike />
          <Gumbi />
          <Polja />
          <Izbire />
          <OznakeInCene />
          <Kartice />
          <ZavihkiDemo />
          <Plasti />
          <Stanja />
        </div>
      </div>
    </ToastProvider>
  );
}

function Razdelek({ id, naslov, opis, children }: { id: string; naslov: string; opis?: string; children: React.ReactNode }) {
  return (
    <section aria-labelledby={id} className="flex flex-col gap-6">
      <div className="flex flex-col gap-1.5 border-b border-line pb-4">
        <h2 id={id} className="type-h2">
          {naslov}
        </h2>
        {opis && <p className="max-w-prose type-body">{opis}</p>}
      </div>
      {children}
    </section>
  );
}

function Primer({ naslov, children, className }: { naslov: string; children: React.ReactNode; className?: string }) {
  return (
    <div className="flex flex-col gap-3">
      <h3 className="type-label font-sans text-ink-subtle">{naslov}</h3>
      <div className={className ?? "flex flex-wrap items-center gap-3"}>{children}</div>
    </div>
  );
}

function Vzorec({ ime, opis }: { ime: string; opis: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [hex, setHex] = useState("");
  useEffect(() => {
    if (ref.current) setHex(getComputedStyle(ref.current).getPropertyValue(`--color-${ime}`).trim());
  }, [ime]);
  return (
    <div ref={ref} className="flex flex-col overflow-hidden rounded-lg bg-surface ring-1 ring-line">
      <div className="h-16 ring-1 ring-line ring-inset" style={{ background: `var(--color-${ime})` }} />
      <div className="flex flex-col gap-0.5 p-3">
        <span className="type-small font-semibold text-ink">{ime}</span>
        <span className="type-caption text-ink-subtle">{opis}</span>
        <span className="type-caption text-ink-subtle type-numeric">{hex || " "}</span>
      </div>
    </div>
  );
}

function Barve() {
  return (
    <Razdelek
      id="barve"
      naslov="Barve"
      opis="Topel lan kot podlaga, zelena njiv za dejanja in glina za redke poudarke. Vsi pari besedila in ozadja dosegajo vsaj 4,5 : 1."
    >
      {barve.map((s) => (
        <Primer key={s.skupina} naslov={s.skupina} className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {s.tokeni.map((t) => (
            <Vzorec key={t.ime} ime={t.ime} opis={t.opis} />
          ))}
        </Primer>
      ))}
      <Primer naslov="Temna ploskev" className="block">
        <div className="flex flex-col gap-2 rounded-xl bg-surface-inverse p-6">
          <p className="type-h3 text-ink-inverse">Domačija Tešlan</p>
          <p className="type-body text-ink-inverse-muted">Podgora 8, 8000 Novo mesto · Odprto po dogovoru</p>
        </div>
      </Primer>
    </Razdelek>
  );
}

function Tipografija() {
  return (
    <Razdelek
      id="tipografija"
      naslov="Tipografija"
      opis="Fraunces za naslove (optična velikost, mehki rezi) in Inter za besedilo in vmesnik. Tracking se zmanjšuje z velikostjo."
    >
      <div className="flex flex-col divide-y divide-line rounded-xl bg-surface ring-1 ring-line">
        {tipi.map((t) => (
          <div key={t.razred} className="grid gap-2 p-5 sm:grid-cols-[10rem_1fr] sm:items-baseline">
            <div className="flex flex-col">
              <span className="type-small font-semibold text-ink">{t.ime}</span>
              <code className="type-caption text-ink-subtle">{t.razred}</code>
            </div>
            <p className={`${t.razred} text-ink`}>{t.primer}</p>
          </div>
        ))}
      </div>
      <Primer naslov="Števke">
        <span className="type-body text-ink">Sorazmerne: 11,11 € · 88,88 €</span>
        <span className="type-body text-ink type-numeric">Tabelarne: 11,11 € · 88,88 €</span>
      </Primer>
    </Razdelek>
  );
}

function Oblike() {
  // Celotna imena razredov, da jih Tailwind najde v izvorni kodi.
  const radiji = ["rounded-xs", "rounded-sm", "rounded-md", "rounded-lg", "rounded-xl", "rounded-2xl", "rounded-full"];
  const sence = ["hairline", "raised", "floating", "overlay"];
  return (
    <Razdelek id="oblike" naslov="Radiji, sence in razmiki" opis="Večja ploskev ima večji radij in globljo senco, da se bere kot debelejša plast.">
      <Primer naslov="Radiji">
        {radiji.map((razred) => (
          <div key={razred} className="flex flex-col items-center gap-2">
            <div className={`size-16 bg-brand-soft ring-1 ring-line-strong ring-inset ${razred}`} />
            <code className="type-caption text-ink-subtle">{razred}</code>
          </div>
        ))}
      </Primer>
      <Primer naslov="Sence">
        {sence.map((s) => (
          <div key={s} className="flex flex-col items-center gap-3">
            <div className="size-24 rounded-lg bg-surface" style={{ boxShadow: `var(--shadow-${s})` }} />
            <code className="type-caption text-ink-subtle">shadow-{s}</code>
          </div>
        ))}
      </Primer>
      <Primer naslov="Razmiki strani" className="flex flex-col gap-2">
        <p className="type-small">
          Robni odmik <code>gutter</code> 1 rem (mobilno) in <code>gutter-lg</code> 2 rem, razmik med razdelki{" "}
          <code>section</code> 4 rem in <code>section-lg</code> 7 rem, širine <code>prose</code> 40 rem,{" "}
          <code>content</code> 72 rem, <code>wide</code> 84 rem.
        </p>
      </Primer>
    </Razdelek>
  );
}

function Gumbi() {
  const variante = ["primary", "secondary", "outline", "ghost", "accent", "danger", "link"] as const;
  return (
    <Razdelek id="gumbi" naslov="Gumbi" opis="Odziv ob pritisku, ne ob spustu. Glavno dejanje na zaslonu je eno samo.">
      {variante.map((v) => (
        <Primer key={v} naslov={v}>
          <Button variant={v} size="sm">
            Majhen
          </Button>
          <Button variant={v}>V košarico</Button>
          <Button variant={v} size="lg">
            Na blagajno <LuArrowRight aria-hidden="true" />
          </Button>
          <Button variant={v} disabled>
            Onemogočen
          </Button>
        </Primer>
      ))}
      <Primer naslov="Stanja in oblike">
        <Button loading>Oddajam naročilo</Button>
        <Button variant="secondary">
          <LuShoppingBag aria-hidden="true" /> S sliko
        </Button>
        <Button variant="ghost" size="icon" aria-label="Odpri meni">
          <LuMenu aria-hidden="true" />
        </Button>
        <Button variant="secondary" size="icon" aria-label="Odstrani postavko">
          <LuTrash2 aria-hidden="true" />
        </Button>
        <Button asChild variant="outline">
          <Link href="/products">Povezava kot gumb</Link>
        </Button>
      </Primer>
      <Primer naslov="Na temni ploskvi (uvod, glava, darila)">
        <div className="flex flex-wrap items-center gap-3 rounded-xl bg-brand-strong p-5">
          <Button variant="bright">V spletno trgovino</Button>
          <Button variant="outlineInverse">Darila</Button>
          <Button variant="ghostInverse" size="icon" aria-label="Košarica">
            <LuShoppingBag aria-hidden="true" />
          </Button>
        </div>
      </Primer>
      <Primer naslov="Čez celo širino" className="max-w-sm">
        <Button block size="lg">
          Oddaj naročilo
        </Button>
      </Primer>
    </Razdelek>
  );
}

function Polja() {
  const [kolicina, setKolicina] = useState(1);
  return (
    <Razdelek id="polja" naslov="Polja obrazca" opis="Oznaka nad poljem, opis pod oznako, napaka pod poljem z ikono in besedilom.">
      <div className="grid gap-6 sm:grid-cols-2">
        <Field label="Ime" required>
          <Input autoComplete="given-name" placeholder="Janez" />
        </Field>
        <Field label="E-pošta" required description="Nanjo pošljemo potrdilo o naročilu.">
          <Input type="email" autoComplete="email" placeholder="ime@primer.si" />
        </Field>
        <Field label="Poštna številka" required error="Vpišite štirimestno poštno številko.">
          <Input inputMode="numeric" defaultValue="80" />
        </Field>
        <Field label="Kraj" disabled>
          <Input defaultValue="Novo mesto" />
        </Field>
        <Field label="Opomba" description="Npr. želeni termin prevzema (največ 500 znakov)." className="sm:col-span-2">
          <Textarea maxLength={500} placeholder="Prevzem v petek popoldne" />
        </Field>
        <Field label="Kategorija">
          <Select defaultValue="zacimbe">
            <SelectTrigger>
              <SelectValue placeholder="Izberite kategorijo" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Kategorije</SelectLabel>
                <SelectItem value="zelenjava">Sveža zelenjava</SelectItem>
                <SelectItem value="zacimbe">Začimbe</SelectItem>
                <SelectItem value="sadje">Liofilizirano sadje</SelectItem>
                <SelectItem value="olja">Olja</SelectItem>
                <SelectItem value="jajca" disabled>
                  Jajca (trenutno ni)
                </SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </Field>
        <Field label="Količina" description="Največ 20 kosov oziroma toliko, kot je na zalogi.">
          <QuantityInput value={kolicina} onChange={setKolicina} max={5} />
        </Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Checkbox
          label={
            <>
              Strinjam se s{" "}
              <Link href="/privacyPolicy" className="text-brand underline underline-offset-4">
                splošnimi pogoji
              </Link>
              .
            </>
          }
        />
        <Checkbox label="Strinjam se s splošnimi pogoji." error="Za oddajo naročila potrdite splošne pogoje." />
        <Checkbox label="Pošlji na naslov prejemnika" description="Paket bo naslovljen na prejemnika darila." defaultChecked />
        <Checkbox label="Onemogočeno" disabled />
      </div>
    </Razdelek>
  );
}

function Izbire() {
  return (
    <Razdelek id="izbire" naslov="Izbirni gumbi" opis="Puščice premikajo izbiro znotraj skupine.">
      <div className="grid gap-8 lg:grid-cols-2">
        <Field label="Velikost" group>
          <RadioGroup defaultValue="41">
            <RadioCard value="41" title="41 ml (15 g)" description="Na zalogi" aside="5,00 €" />
            <RadioCard value="106" title="106 ml (40 g)" description="Še 2 kosa" aside="12,00 €" />
            <RadioCard value="212" title="212 ml" description="Ni na zalogi" aside="20,00 €" disabled />
          </RadioGroup>
        </Field>
        <div className="flex flex-col gap-8">
          <Field label="Dostava" group error="Pošta ni mogoča, ker so v košarici jajca (samo prevzem).">
            <RadioGroup defaultValue="prevzem">
              <RadioItem value="prevzem" label="Prevzem na kmetiji" />
              <RadioItem value="posta" label="Pošta" disabled />
            </RadioGroup>
          </Field>
          <Field label="Plačilo" group description="Pri prevzemu lahko plačate s kartico ali ob prevzemu.">
            <RadioGroup defaultValue="kartica" className="flex flex-wrap gap-x-6">
              <RadioItem value="kartica" label="Kartica" />
              <RadioItem value="ob-prevzemu" label="Ob prevzemu" />
            </RadioGroup>
          </Field>
        </div>
      </div>
    </Razdelek>
  );
}

function OznakeInCene() {
  return (
    <Razdelek id="oznake" naslov="Oznake in cene" opis="Oznake razpoložljivosti (Z13) povedo pomen z besedilom, barva ga samo podpre.">
      <Primer naslov="Razpoložljivost">
        <Badge variant="success" dot>Na zalogi</Badge>
        <Badge variant="warning" dot>Še 2 kosa</Badge>
        <Badge variant="danger" dot>Ni na zalogi</Badge>
        <Badge variant="info">Kmalu</Badge>
        <Badge variant="accent">Sezona april — junij</Badge>
        <Badge variant="neutral">Samo prevzem na kmetiji</Badge>
        <Badge variant="outline">Na voljo na kmetiji</Badge>
        <Badge variant="brand">Primerno za darilo</Badge>
      </Primer>
      <Primer naslov="Cene">
        <Price cents={500} size="sm" />
        <Price cents={1200} />
        <Price cents={500} from />
        <Price cents={2000} size="lg" />
        <Price cents={800} previousCents={1000} />
      </Primer>
    </Razdelek>
  );
}

function Kartice() {
  return (
    <Razdelek id="kartice" naslov="Kartice" opis="Kartica izdelka je v celoti povezava; odzove se ob pritisku.">
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <Card interactive>
          <ImagePlaceholder />
          <CardBody>
            <div className="flex flex-wrap gap-2">
              <Badge variant="success" dot>Na zalogi</Badge>
            </div>
            <CardTitle>
              <Link href="/products" className="after:absolute after:inset-0 focus-visible:outline-none">
                Česen v prahu
              </Link>
            </CardTitle>
            <p className="type-small">Posušen in zmlet doma. Za juhe, omake in pečeno meso.</p>
          </CardBody>
          <CardFooter>
            <Price cents={500} from />
            <span className="type-small text-ink-subtle">2 velikosti</span>
          </CardFooter>
        </Card>
        <Card>
          <ImagePlaceholder />
          <CardBody>
            <div className="flex flex-wrap gap-2">
              <Badge variant="info">Kmalu</Badge>
              <Badge variant="neutral">Samo prevzem na kmetiji</Badge>
            </div>
            <CardTitle>Šparglji</CardTitle>
            <p className="type-small">Zeleni šparglji iz peščene zemlje, nabrani zjutraj.</p>
          </CardBody>
          <CardFooter>
            <Price cents={550} />
            <Button size="sm" disabled>
              V košarico
            </Button>
          </CardFooter>
        </Card>
        <Card>
          <CardBody className="gap-3">
            <p className="type-label text-accent">Darilo</p>
            <CardTitle>Okusi Dolenjske</CardTitle>
            <p className="type-small">Mala darilna škatla s česnom v prahu, šparglji v prahu in borovničevo marmelado.</p>
          </CardBody>
          <CardFooter>
            <Price cents={2300} />
            <Button size="sm" variant="secondary">
              Sestavi
            </Button>
          </CardFooter>
        </Card>
      </div>
    </Razdelek>
  );
}

function ZavihkiDemo() {
  return (
    <Razdelek id="zavihki" naslov="Zavihki">
      <Tabs defaultValue="opis">
        <TabsList aria-label="Podatki o izdelku">
          <TabsTrigger value="opis">Opis</TabsTrigger>
          <TabsTrigger value="sestavine">Sestavine</TabsTrigger>
          <TabsTrigger value="prevzem">Prevzem in dostava</TabsTrigger>
        </TabsList>
        <TabsContent value="opis" className="max-w-prose type-body">
          Česen posušimo pri nizki temperaturi in zmeljemo tik pred polnjenjem, da ohrani aromo.
        </TabsContent>
        <TabsContent value="sestavine" className="max-w-prose type-body">
          100 % česen. Brez dodatkov.
        </TabsContent>
        <TabsContent value="prevzem" className="max-w-prose type-body">
          Prevzem na kmetiji po dogovoru ali pošiljanje po pošti v treh delovnih dneh.
        </TabsContent>
      </Tabs>
    </Razdelek>
  );
}

function Plasti() {
  const { toast } = useToast();
  return (
    <Razdelek
      id="plasti"
      naslov="Dialog, predal in obvestila"
      opis="Plasti pridejo od tam, kamor odidejo. Predal in obvestilo lahko odvlečete; odloči hitrost poteze."
    >
      <Primer naslov="Dialog">
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="secondary">Odstrani iz košarice</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Odstranim darilno škatlo?</DialogTitle>
              <DialogDescription>
                Škatla „Okusi Dolenjske“ in sporočilo na kartici bosta odstranjena iz košarice.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="secondary">Prekliči</Button>
              </DialogClose>
              <DialogClose asChild>
                <Button variant="danger">Odstrani</Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </Primer>
      <Primer naslov="Predal">
        {(["right", "left", "bottom"] as const).map((stran) => (
          <Sheet key={stran}>
            <SheetTrigger asChild>
              <Button variant="secondary">
                {stran === "right" ? "Predal desno" : stran === "left" ? "Predal levo" : "Predal spodaj"}
              </Button>
            </SheetTrigger>
            <SheetContent side={stran}>
              <SheetTitle>Košarica</SheetTitle>
              <SheetDescription>Predal ostane, dokler ga ne zaprete ali odvlečete.</SheetDescription>
              <EmptyState
                icon={<LuShoppingBag aria-hidden="true" />}
                title="Košarica je prazna"
                description="Dodajte izdelke s seznama ponudbe."
              />
            </SheetContent>
          </Sheet>
        ))}
      </Primer>
      <Primer naslov="Obvestila">
        <Button variant="secondary" onClick={() => toast({ title: "Dodano v košarico", description: "Česen v prahu, 41 ml", variant: "success" })}>
          Uspeh
        </Button>
        <Button
          variant="secondary"
          onClick={() =>
            toast({
              title: "Zaloga se je spremenila",
              description: "Na zalogi sta le še 2 kosa.",
              variant: "info",
              action: { label: "Popravi količino", onClick: () => {} },
            })
          }
        >
          Informacija z dejanjem
        </Button>
        <Button variant="secondary" onClick={() => toast({ title: "Naročila ni bilo mogoče oddati", description: "Poskusite znova čez nekaj minut.", variant: "danger" })}>
          Napaka
        </Button>
      </Primer>
    </Razdelek>
  );
}

function Stanja() {
  return (
    <Razdelek id="stanja" naslov="Nalaganje in prazna stanja">
      <div className="grid gap-6 lg:grid-cols-2">
        <Primer naslov="Okostje" className="block">
          <Card>
            <Skeleton className="aspect-[4/3] rounded-none" />
            <CardBody>
              <Skeleton className="h-6 w-2/3" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-4/5" />
            </CardBody>
          </Card>
        </Primer>
        <Primer naslov="Prazno stanje" className="block">
          <EmptyState
            icon={<LuPackage aria-hidden="true" />}
            title="Ni izdelkov v tej kategoriji"
            description="Poglejte drugo kategorijo ali se vrnite pozneje, ko bo nova sezona."
            action={
              <Button asChild variant="secondary">
                <Link href="/products">Vsi izdelki</Link>
              </Button>
            }
          />
        </Primer>
      </div>
      <Primer naslov="Kazalnik">
        <span className="inline-flex items-center gap-2 type-small text-ink">
          <Spinner /> Preverjam zalogo …
        </span>
      </Primer>
    </Razdelek>
  );
}
