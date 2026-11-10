import { useId } from "react";
import { cn } from "@/lib/utils";

const v = (ime: string) => `var(--color-${ime})`;

/**
 * Ilustracija darilne škatle: odprta kartonska škatla v izometričnem
 * pogledu s steklenico olja, kozarcem marmelade, kozarčkom začimbe in
 * vejico zelenja, s trakom, pentljo in listkom. Narisana je kot vektor
 * (SVG), zato je ostra na vsakem zaslonu, tehta nekaj kilobajtov in ne čaka
 * na fotografije izdelkov.
 *
 * Barve so tokeni (`kraft-*` so samo za ilustracije), prelivi dajo ploskvam
 * svetlobo z leve zgoraj. Iskrice so na temni ploskvi svetlo zelene, na
 * svetli v barvi poudarka. Okras: brez pomena za bralnik zaslona, če kliče
 * komponento brez `oznaka`.
 */
export function RenderDarilneSkatle({
  naTemnem = false,
  oznaka,
  className,
}: {
  /** Ilustracija stoji na temni ploskvi (darilni program na domači strani). */
  naTemnem?: boolean;
  /** Besedilo za bralnik zaslona; brez njega je ilustracija okras. */
  oznaka?: string;
  className?: string;
}) {
  // Več ilustracij na isti strani ne sme deliti id-jev prelivov.
  const id = `sk${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const url = (ime: string) => `url(#${id}-${ime})`;
  const steklo = url("steklo");
  const trak = url("trak");

  return (
    <svg
      viewBox="0 0 480 440"
      xmlns="http://www.w3.org/2000/svg"
      role={oznaka ? "img" : undefined}
      aria-label={oznaka}
      aria-hidden={oznaka ? undefined : true}
      className={cn("h-auto w-full", className)}
    >
      <defs>
        <linearGradient id={`${id}-leva`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" style={{ stopColor: v("kraft-light") }} />
          <stop offset="1" style={{ stopColor: v("kraft") }} />
        </linearGradient>
        <linearGradient id={`${id}-desna`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" style={{ stopColor: v("kraft") }} />
          <stop offset="1" style={{ stopColor: v("kraft-dark") }} />
        </linearGradient>
        <linearGradient id={`${id}-notri`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" style={{ stopColor: v("kraft-dark") }} />
          <stop offset="1" style={{ stopColor: v("kraft-deep") }} />
        </linearGradient>
        <linearGradient id={`${id}-steklo`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" style={{ stopColor: v("surface"), stopOpacity: 0.5 }} />
          <stop offset=".3" style={{ stopColor: v("surface"), stopOpacity: 0.08 }} />
          <stop offset=".8" style={{ stopColor: v("surface"), stopOpacity: 0 }} />
          <stop offset="1" style={{ stopColor: v("surface"), stopOpacity: 0.28 }} />
        </linearGradient>
        <linearGradient id={`${id}-trak`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" style={{ stopColor: v("accent") }} />
          <stop offset="1" style={{ stopColor: v("accent-strong") }} />
        </linearGradient>
        <linearGradient id={`${id}-globina`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" style={{ stopColor: v("ink"), stopOpacity: 0 }} />
          <stop offset="1" style={{ stopColor: v("ink"), stopOpacity: 0.38 }} />
        </linearGradient>
        <filter id={`${id}-senca`} x="-20%" y="-60%" width="140%" height="220%">
          <feGaussianBlur stdDeviation="12" />
        </filter>
        <clipPath id={`${id}-odprtina`}>
          <path d="M240 250 L392 174 L240 98 L88 174 Z" />
        </clipPath>
      </defs>

      {/* Senca na tleh. */}
      <ellipse cx="240" cy="392" rx="176" ry="24" className="fill-ink" opacity=".3" filter={url("senca")} />

      {/* Notranjost in lesna volna. */}
      <path d="M240 250 L392 174 L240 98 L88 174 Z" fill={url("notri")} />
      <path d="M240 98 L240 200" className="stroke-kraft-deep" strokeWidth="2" opacity=".55" />
      <g clipPath={url("odprtina")}>
        <path d="M240 262 L384 190 L240 122 L96 190 Z" className="fill-surface-muted" />
        <g className="fill-none stroke-kraft" strokeWidth="2.5" strokeLinecap="round" opacity=".7">
          <path d="M112 188 q12 -10 24 0 t24 0" />
          <path d="M312 150 q12 -8 24 0 t24 2" />
          <path d="M196 132 q10 -8 20 0 t20 0" />
          <path d="M336 196 q10 -8 20 0 t18 -2" />
          <path d="M140 168 q8 8 18 2" />
          <path d="M276 238 q10 -8 20 0 t20 0" />
          <path d="M186 232 q10 -8 20 0 t16 2" />
          <path d="M250 120 q10 6 20 0" />
          <path d="M124 208 q10 -8 20 0 t20 2" />
          <path d="M150 222 q10 -8 20 0" />
        </g>
      </g>

      {/* Vejica zelenja zadaj. */}
      <path d="M246 150 C240 110 250 80 270 52" className="fill-none stroke-brand" strokeWidth="3" strokeLinecap="round" />
      <g className="fill-brand-leaf">
        <path d="M270 52 q-22 2 -24 22 q20 0 24 -22 Z" />
        <path d="M262 68 q20 -8 30 6 q-18 10 -30 -6 Z" />
        <path d="M250 92 q-20 -6 -28 10 q18 8 28 -10 Z" />
        <path d="M250 104 q18 -10 30 2 q-16 12 -30 -2 Z" />
        <path d="M246 126 q-18 -8 -28 6 q16 10 28 -6 Z" />
      </g>

      {/* Steklenica olja (zadaj levo). */}
      <rect x="171" y="22" width="20" height="18" rx="3" className="fill-kraft" />
      <rect x="169" y="36" width="24" height="8" rx="2" className="fill-kraft-dark" />
      <path d="M172 42 h18 v30 q20 10 20 36 v100 h-58 v-100 q0 -26 20 -36 Z" className="fill-brand-strong" />
      <path d="M172 42 h18 v30 q20 10 20 36 v100 h-58 v-100 q0 -26 20 -36 Z" fill={steklo} />
      <rect x="158" y="118" width="46" height="56" rx="5" className="fill-surface" />
      <path d="M181 130 c-10 7 -10 20 0 28 c10 -8 10 -21 0 -28 Z" className="fill-brand" />
      <rect x="167" y="163" width="28" height="3" rx="1.5" className="fill-line-strong" opacity=".6" />

      {/* Kozarec marmelade (zadaj desno). */}
      <rect x="268" y="98" width="88" height="112" rx="14" className="fill-accent-strong" />
      <rect x="268" y="98" width="88" height="112" rx="14" fill={steklo} />
      <rect x="263" y="80" width="98" height="26" rx="7" className="fill-accent" />
      <rect x="263" y="80" width="98" height="9" rx="4.5" className="fill-surface" opacity=".22" />
      <rect x="279" y="124" width="66" height="48" rx="6" className="fill-surface" />
      <circle cx="312" cy="145" r="9" className="fill-accent" />
      <path d="M312 134 q6 -8 12 -4 q-4 6 -12 4 Z" className="fill-brand" />
      <rect x="291" y="160" width="42" height="3" rx="1.5" className="fill-line-strong" opacity=".6" />

      {/* Kozarček začimbe (spredaj na sredini). */}
      <rect x="204" y="156" width="64" height="96" rx="10" className="fill-brand-soft" />
      <path d="M204 200 h64 v42 a10 10 0 0 1 -10 10 h-44 a10 10 0 0 1 -10 -10 Z" className="fill-brand" opacity=".8" />
      <rect x="204" y="156" width="64" height="96" rx="10" fill={steklo} />
      <rect x="200" y="140" width="72" height="22" rx="6" className="fill-brand-strong" />
      <rect x="200" y="140" width="72" height="7" rx="3.5" className="fill-surface" opacity=".2" />
      <rect x="213" y="176" width="46" height="34" rx="5" className="fill-surface" />
      <rect x="221" y="186" width="30" height="3.5" rx="1.75" className="fill-brand" />
      <rect x="225" y="195" width="22" height="3" rx="1.5" className="fill-line-strong" opacity=".6" />

      {/* Globina: izdelki tonejo v škatlo. */}
      <path
        d="M88 132 L240 208 L392 132 L392 174 L240 250 L88 174 Z"
        fill={url("globina")}
        clipPath={url("odprtina")}
      />

      {/* Sprednji ploskvi z žigom kmetije. */}
      <path d="M88 174 L240 250 L240 386 L88 310 Z" fill={url("leva")} />
      <path d="M240 250 L392 174 L392 310 L240 386 Z" fill={url("desna")} />
      <path d="M240 250 L240 386" className="stroke-kraft-deep" strokeWidth="1.5" opacity=".35" />
      <g
        transform="translate(362 262) skewY(-26.57)"
        opacity=".42"
        className="fill-none stroke-kraft-deep"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle r="19" />
        <path d="M0 9 V-3 M0 -3 c-7 -1 -9 -8 -5 -12 c2 4 6 6 5 12 M0 1 c6 -1 9 -6 7 -11 c-4 2 -7 5 -7 11" />
      </g>

      {/* Trak, rob škatle in pentlja. */}
      <path d="M148 204 L180 220 L180 356 L148 340 Z" fill={trak} />
      <path d="M300 220 L332 204 L332 340 L300 356 Z" fill={trak} />
      <path d="M300 220 L332 204 L332 340 L300 356 Z" className="fill-ink" opacity=".14" />
      <path
        d="M88 174 L240 250 L392 174"
        className="fill-none stroke-kraft-light"
        strokeWidth="3.5"
        strokeLinejoin="round"
      />
      <path d="M164 212 c-34 -30 -62 -18 -52 4 c6 14 30 10 52 -4 Z" fill={trak} />
      <path d="M164 212 c12 -40 44 -44 48 -22 c2 16 -22 22 -48 22 Z" fill={trak} />
      <path d="M164 212 c-34 -30 -62 -18 -52 4 c6 14 30 10 52 -4 Z" className="fill-ink" opacity=".12" />
      <path d="M160 214 l-18 40 l14 -6 l6 14 l8 -44 Z" className="fill-accent-strong" />
      <path d="M168 214 l22 34 l-15 -2 l-3 15 l-12 -45 Z" className="fill-accent" />
      <ellipse cx="164" cy="212" rx="11" ry="9" className="fill-accent" />
      <ellipse cx="162" cy="209" rx="5" ry="3" className="fill-surface" opacity=".25" />

      {/* Listek s sporočilom. */}
      <g transform="rotate(8 262 300)">
        <path d="M240 252 q6 22 14 34" className="fill-none stroke-surface" strokeWidth="2" />
        <rect x="236" y="284" width="52" height="66" rx="7" className="fill-surface" />
        <circle cx="262" cy="295" r="3.5" className="fill-kraft" />
        <path
          d="M262 331 c-15 -10 -13 -23 -5 -23 c3 0 5 2 5 5 c0 -3 2 -5 5 -5 c8 0 10 13 -5 23 Z"
          className="fill-accent"
        />
      </g>

      {/* Iskrice. */}
      <g className={naTemnem ? "fill-brand-bright" : "fill-accent"}>
        <path d="M418 78 l5 14 l14 5 l-14 5 l-5 14 l-5 -14 l-14 -5 l14 -5 Z" />
        <path d="M62 112 l3.5 10 l10 3.5 l-10 3.5 l-3.5 10 l-3.5 -10 l-10 -3.5 l10 -3.5 Z" opacity=".8" />
        <path d="M436 236 l3 8 l8 3 l-8 3 l-3 8 l-3 -8 l-8 -3 l8 -3 Z" opacity=".7" />
      </g>
    </svg>
  );
}
