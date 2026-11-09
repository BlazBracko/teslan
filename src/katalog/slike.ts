/**
 * Naslov slike za `next/image`. Payload z nastavljenim `serverURL` vrne
 * absoluten naslov; slike z lastnega strežnika spremenimo v relativne, da
 * jih Next optimizira brez nastavitve oddaljenih virov. Slike iz R2 ostanejo
 * absolutne.
 */
export function potSlike(url: string, siteUrl = process.env.NEXT_PUBLIC_SITE_URL): string {
  if (siteUrl) {
    const izvor = new URL(siteUrl).origin;
    if (url.startsWith(`${izvor}/`)) return url.slice(izvor.length);
  }
  return url;
}
