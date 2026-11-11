import Image from "next/image";
import { RichText } from "@payloadcms/richtext-lexical/react";
import type { IzdelekPogled } from "@/katalog/podatki";

/**
 * Zgodba izdelka pod izbiro količine (podstran izdelka): dolg opis iz CMS
 * („Dolg opis“ v adminu) ob fotografiji s kmetije. Če opisa še ni, ostane
 * kratek opis in nekaj besed o kmetiji, da stran nikoli ni prazna.
 */
export function ZgodbaIzdelka({ izdelek }: { izdelek: IzdelekPogled }) {
  const imaOpis = Boolean(izdelek.opis?.root?.children?.length);
  return (
    <section
      aria-labelledby="zgodba-izdelka"
      className="mt-12 grid overflow-hidden rounded-2xl bg-surface shadow-raised ring-1 ring-line md:mt-16 lg:grid-cols-12"
    >
      <div className="flex flex-col gap-4 p-5 sm:gap-5 sm:p-10 lg:col-span-7 lg:p-14">
        <p className="type-label text-accent">Zgodba izdelka</p>
        <h2 id="zgodba-izdelka" className="type-h2 text-ink">
          {izdelek.ime} z Domačije Tešlan
        </h2>
        {imaOpis ? (
          <RichText
            data={izdelek.opis as Parameters<typeof RichText>[0]["data"]}
            className="besedilo-cms besedilo-zgodba max-w-prose"
          />
        ) : (
          <div className="besedilo-cms besedilo-zgodba max-w-prose">
            {izdelek.kratekOpis && <p>{izdelek.kratekOpis}</p>}
            <p>
              Na Domačiji Tešlan v Podgori pri Novem mestu delamo v majhnih količinah in z veliko ročnega dela. Kar
              pripravimo, tudi sami jemo, zato vemo, kaj je v vsakem kozarcu in vrečki.
            </p>
            <p>Če vas zanima, kako izdelek najbolje uporabiti, nas pokličite. Z veseljem povemo več.</p>
          </div>
        )}
        <p className="mt-2 flex items-center gap-3 border-t border-line pt-5 type-small text-ink-muted">
          <Image src="/logo.png" alt="" width={36} height={36} className="size-9 rounded-full bg-canvas object-contain" />
          Domačija Tešlan · Podgora pri Novem mestu
        </p>
      </div>
      <div className="relative min-h-72 lg:col-span-5 lg:min-h-full">
        <Image
          src="/sandi.jpg"
          alt="Sandi Derčar za stojnico Domačije Tešlan s svežo zelenjavo in šparglji"
          fill
          sizes="(min-width: 1024px) 30rem, 100vw"
          className="object-cover"
          style={{ objectPosition: "50% 30%" }}
        />
      </div>
    </section>
  );
}
