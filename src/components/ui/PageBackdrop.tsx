import Image from 'next/image';

/**
 * Fiksno zabrisano ozadje strani.
 *
 * Leži pod vso vsebino in se ne premika — stran drsi po njem. Ker so
 * vstavljeni bloki neprozorni, se slika vidi za herojem oziroma glavo
 * podstrani in v režah med bloki. Prav ti pasovi barve dajo strani
 * grafični značaj.
 *
 * Vsaka stran dobi svojo sliko; nastavi se ob klicu.
 *
 * Namenoma `position: fixed` na elementu, ne `background-attachment: fixed`
 * — slednji na iOS Safariju ne deluje.
 *
 * POZOR: deluje samo, ker ima `body` v globals.css `isolation: isolate`.
 * Brez tega `body` ni stacking context, negativni z-index pripada kontekstu
 * `html` in se nariše pred ozadjem `body`-ja, ki ga nato prekrije.
 *
 * `scale-105`, ker CSS `blur()` vzorči tudi zunaj škatle elementa in bi
 * robovi zbledeli; povečava jih potisne iz vidnega polja.
 */
export default function PageBackdrop({
  src,
  /**
   * Moč globalnega zaslona. Namenoma šibak: v režah med bloki ni besedila,
   * zato tam kontrast ni pomemben in slika lahko pride do izraza — pri 0,30
   * se vidi 70 % fotografije. Za berljivost skrbi `heroScrim` tam, kjer
   * kremno besedilo res leži nad ozadjem.
   */
  scrim = 0.3,
  /**
   * Del slike, ki naj bo v kadru. Privzeti center pri `object-cover` na
   * širokem viewportu obreže zanimivi del stran.
   */
  objectPosition = '50% 22%',
  blur = 14,
}: {
  src: string;
  scrim?: number;
  objectPosition?: string;
  blur?: number;
}) {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <Image
        src={src}
        alt=""
        fill
        priority
        /* Sliko zabrišemo, zato je nesmiselno prenašati polno ločljivost. */
        sizes="30vw"
        className="scale-105 object-cover"
        style={{ filter: `blur(${blur}px)`, objectPosition }}
      />
      <div className="absolute inset-0" style={{ backgroundColor: `rgb(26 58 42 / ${scrim})` }} />
    </div>
  );
}

/**
 * Zaslon za predele, kjer kremno besedilo leži neposredno nad ozadjem —
 * hero in glava podstrani.
 *
 * 0,55 ni izbrano na oko. Izmerjena svetlost obeh fotografij po blurju:
 * najsvetlejši predel strawberryFields 0,698, asparagusField 0,559. Skupaj
 * z globalnim zaslonom (0,30) to da kontrast kremnega besedila 5,01:1 in
 * 5,45:1, torej nad AA zahtevo 4,5:1. Pri prejšnjih 0,35 je bil pri
 * strawberryFields le 4,15:1, kar je bilo premalo.
 */
export const heroScrim = 'absolute inset-0 bg-green-deep/55';
