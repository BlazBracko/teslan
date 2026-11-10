import "./(frontend)/globals.css";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { LuSearch } from "react-icons/lu";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { EmptyState } from "@/components/ui/EmptyState";
import { IME_KMETIJE } from "@/lib/kontakt";
import { razrediPisav } from "./(frontend)/pisave";

export const metadata: Metadata = {
  title: `Strani ni mogoče najti — ${IME_KMETIJE}`,
  robots: { index: false, follow: false },
};

/**
 * 404 za naslove, ki ne ustrezajo nobeni poti (Z6, S17). Aplikacija ima dva
 * korenska layouta (javna stran in admin), zato Next brez te datoteke vrne
 * privzeto stran brez jezika in glavne regije. Stran je statična (brez
 * baze), zato glava ni ista kot na ostalih straneh: samo logotip in pot
 * nazaj. Neobstoječ izdelek ali naročilo pokaže `(frontend)/not-found.tsx`.
 */
export default function GlobalNotFound() {
  return (
    <html lang="sl" className={razrediPisav}>
      <body className="flex min-h-dvh flex-col">
        {/* Enak otok kot glava ostalih strani, le brez navigacije in košarice. */}
        <header className="px-3 pt-3 lg:px-gutter-lg">
          <div className="mx-auto flex h-14 max-w-content items-center rounded-[1.375rem] bg-brand px-3 shadow-floating md:h-16 md:px-4">
            <Link
              href="/"
              className="flex items-center gap-2.5 rounded-xl py-1 pr-2 focus-visible:outline-ink-inverse"
            >
              <Image
                src="/logo.png"
                alt=""
                width={40}
                height={40}
                className="size-9 rounded-full bg-surface object-contain md:size-10"
              />
              <span className="font-display type-title text-ink-inverse">{IME_KMETIJE}</span>
            </Link>
          </div>
        </header>
        <main id="vsebina" className="flex-1">
          <Container size="prose" className="py-section">
            <EmptyState
              icon={<LuSearch />}
              titleAs="h1"
              title="Strani ni mogoče najti"
              description="Povezava je morda zastarela ali napačno zapisana."
              action={
                <div className="flex flex-wrap justify-center gap-3">
                  <Button asChild>
                    <Link href="/products">Na seznam izdelkov</Link>
                  </Button>
                  <Button asChild variant="secondary">
                    <Link href="/">Na domačo stran</Link>
                  </Button>
                </div>
              }
            />
          </Container>
        </main>
      </body>
    </html>
  );
}
