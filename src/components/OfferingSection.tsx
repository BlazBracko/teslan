import Image from 'next/image';
import SectionHeading from '@/components/ui/SectionHeading';
import Reveal, { RevealGroup, RevealItem } from '@/components/ui/Reveal';
import Pressable from '@/components/ui/Pressable';
import { offering, type OfferingGroupView } from '@/data/offering';
import { priceListTotal } from '@/data/priceList';
import { sectionShell } from '@/components/ui/sectionShell';

const formatPrice = (price: number) => price.toFixed(2).replace('.', ',');

/**
 * Pregled ponudbe: štiri ploščice, besedilo levo, fotografija desno.
 *
 * Prej je bila tu nadzorna plošča zaloge — devet ploščic s številom izdelkov
 * v veliki zeleni pisavi in cenovnim razponom, pod njimi še pas devetih
 * ovalnih značk, skupaj trinajst škatel z besedilom in nobene fotografije v
 * sekciji, ki govori o hrani. Bralo se je kot izvoz iz baze.
 *
 * Kar se je spremenilo:
 *
 *  - števila in cenovni razponi ven, imena dejanskih izdelkov noter
 *    (razpon „2,50—14,00 €“ je statistika o množici, ne cena nečesa)
 *  - devet kategorij združenih v štiri skupine, kot ljudje mislijo o hrani
 *  - vsaka ploščica dobi fotografijo
 *  - pas sezonskih značk je pobran v prvo ploščico, kamor spada
 *
 * Odpadlo je tudi pravilo „večja kategorija dobi širšo ploščico“. Obiskovalec
 * ne more zaznati, da je škatla širša, ker je v njej šest in ne dva izdelka,
 * torej ni sporočalo ničesar, postavitev pa je razbilo.
 *
 * Rob med besedilom in sliko je raven, ne poševen. Cel vizualni jezik strani
 * so mehki koncentrični zaobljeni pravokotniki (sekcija 28px, otok
 * navigacije 22px, ploščica 16px); poševnica bi bila edina diagonala na
 * strani in pri tej širini bi fotografijo obrezala v ozek trikotnik, v
 * katerem se motiv izgubi.
 */
export default function OfferingSection() {
  return (
    <section className={`${sectionShell} bg-green-mid px-6 py-24 md:px-10`}>
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          onDark
          label="Naša ponudba"
          title="Več kot le sveža zelenjava"
          description={`Na ceniku je ${priceListTotal} izdelkov — od svežih špargljev z njive do domačih testenin, začimb in marmelad.`}
          className="mx-auto mb-12"
        />

        <RevealGroup className="grid gap-4 md:grid-cols-2" stagger={0.07}>
          {offering.map((group) => (
            <GroupTile key={group.name} group={group} />
          ))}
        </RevealGroup>

        <Reveal className="mt-12 flex justify-center">
          <Pressable href="/products" variant="primary">
            Poglej cel cenik
            <span aria-hidden>→</span>
          </Pressable>
        </Reveal>
      </div>
    </section>
  );
}

/**
 * `min-h` je nujen: brez njega bi se pri kratkem besedilu stolpec s sliko
 * sesedel, ker višino vrstice določa vsebina. Enaka rešitev kot pri karticah
 * na `/products`.
 */
function GroupTile({ group }: { group: OfferingGroupView }) {
  return (
    <RevealItem
      as="article"
      className="flex min-h-44 overflow-hidden rounded-2xl border border-cream/12 bg-cream/[0.06] sm:min-h-48"
    >
      <div className="flex flex-1 flex-col gap-2 p-5 sm:p-6">
        <h3 className="type-h3 text-cream">{group.name}</h3>
        <p className="type-small text-cream/70">{group.blurb}</p>
        <p className="type-label mt-auto pt-3 text-green-bright">
          od {formatPrice(group.fromPrice)} €
        </p>
      </div>

      {/* Ploskev pod izrezki ni okras. `jagode.png` je prosojen PNG, `cesen.jpg`
          in `krompir.jpg` pa imata belo ozadje: na temno zeleni podlagi bi bel
          JPEG pokazal bel kvadrat, prosojni PNG pa bi se utopil.
          Ploskev je BELA in ne kremna — kremna se od belega ozadja izrezkov
          ravno toliko razlikuje, da se vidi bel kvadrat v kvadratu. Isti prijem
          kot bele kartice na `/products`. Prave fotografije jo prekrijejo od
          roba do roba. */}
      <div className="relative w-28 shrink-0 self-stretch bg-white sm:w-36 md:w-40">
        {group.image ? (
          <Image
            src={group.image}
            alt={group.imageAlt ?? group.name}
            fill
            sizes="(max-width: 640px) 112px, (max-width: 768px) 144px, 160px"
            className={group.imageFit === 'cover' ? 'object-cover' : 'object-contain p-3'}
          />
        ) : (
          <GroupImagePlaceholder label={group.name} />
        )}
      </div>
    </RevealItem>
  );
}

/**
 * Nadomestna ploskev, kadar skupina še ni dobila fotografije.
 *
 * Namenoma tiha, enako kot na karticah izdelkov: ploščica ostane enotna z
 * ostalimi tremi in dodajanje prave fotografije stran samo izboljša.
 */
function GroupImagePlaceholder({ label }: { label: string }) {
  return (
    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-green-light/12 to-green-bright/8 p-3">
      <span className="type-label text-center leading-tight text-green-mid/45">{label}</span>
    </div>
  );
}
