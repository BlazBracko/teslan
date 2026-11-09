import { Price } from "@/components/ui/Price";
import { oznakaStopnje, type DDVPoStopnji } from "@/kosarica/cene";
import { formatirajCeno } from "@/lib/denar";

/**
 * Zneski naročila (Z23, Z24): vmesni seštevek, poštnina, skupaj in DDV po
 * stopnjah. Isti prikaz na blagajni in na potrdilu naročila.
 */
export function Zneski({
  vmesniSestevekCenti,
  postninaCenti,
  skupajCenti,
  ddv,
  posta,
}: {
  vmesniSestevekCenti: number;
  postninaCenti: number;
  skupajCenti: number;
  ddv: readonly DDVPoStopnji[];
  /** Pri prevzemu se vrstica s poštnino ne pokaže. */
  posta: boolean;
}) {
  return (
    <dl className="flex flex-col gap-3 type-body">
      <div className="flex items-baseline justify-between gap-4">
        <dt className="text-ink-muted">Vmesni seštevek</dt>
        <dd data-testid="vmesni-sestevek" className="type-numeric">
          {formatirajCeno(vmesniSestevekCenti)}
        </dd>
      </div>
      {posta && (
        <div className="flex items-baseline justify-between gap-4">
          <dt className="text-ink-muted">Poštnina</dt>
          <dd data-testid="postnina" className="type-numeric">
            {postninaCenti === 0 ? "brezplačno" : formatirajCeno(postninaCenti)}
          </dd>
        </div>
      )}
      <div className="flex items-baseline justify-between gap-4 border-t border-line pt-3">
        <dt className="font-semibold text-ink">Skupaj</dt>
        <dd data-testid="skupaj">
          <Price cents={skupajCenti} size="lg" />
        </dd>
      </div>
      {ddv.map((d) => (
        <div key={d.stopnja} className="flex items-baseline justify-between gap-4 type-small text-ink-muted">
          <dt>Vključen DDV {oznakaStopnje(d.stopnja)}</dt>
          <dd className="type-numeric">{formatirajCeno(d.ddvCenti)}</dd>
        </div>
      ))}
    </dl>
  );
}
