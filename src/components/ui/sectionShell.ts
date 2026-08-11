/**
 * Vstavljene zaobljene sekcije.
 *
 * Sekcije niso pasovi čez celo širino, ampak zaobljeni bloki, ki plavajo na
 * eni sami podlagi (`body` je green-deep). Med njimi je reža, skozi katero
 * se vidi podlaga.
 *
 * S tem prehodov ni več treba obravnavati — ni jih, ker ni robov. Blok se
 * začne in konča sam v sebi. Isti jezik kot plavajoči otok navigacije,
 * samo v večjem merilu.
 *
 * Vrednosti so tu, da radij in reža ne razideta med sekcijami.
 */

/** Razred za vsako sekcijo, ki je vstavljen blok. */
export const sectionShell = 'overflow-hidden rounded-[28px] md:rounded-[36px]';

/**
 * Ovoj okoli vseh vstavljenih blokov na strani: stranski odmik in reže.
 * Hero in footer sta namerno zunaj — cel zaslon na vrhu in zaključek na
 * dnu držita stran, da ne izgleda kot kup lebdečih kartic brez okvirja.
 *
 * `max-w` je bistven. Brez njega so se bloki raztezali čez cel zaslon
 * (izmerjeno 2295px na 2327px zaslonu), vsebina v njih pa je bila omejena
 * na 1280px — torej ~500px prazne kremne ploskve na vsaki strani. Zdaj je
 * blok sam omejen in ob njem se vidi temna podlaga.
 */
export const sectionStack =
  'mx-auto flex w-full max-w-[1240px] flex-col gap-3 px-3 py-3 md:gap-4 md:px-4 md:py-4';
