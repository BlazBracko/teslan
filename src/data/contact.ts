const address = 'Podgora 15, 8351 Straža pri Novem mestu';

export const contact = {
  name: 'Sandi Derčar',
  address,
  phone: '+386 40 578 512',
  phoneDisplay: '040 578 512',
  email: 'sandi.dercar@gmail.com',

  /**
   * Google Maps na naslovu.
   *
   * Zgrajeno prek uradnega Google Maps URL API in z `encodeURIComponent`.
   * Prej je bil naslov ročno zapisan kot `.../place/Podgora+15,+8351+Straža`
   * — brez „pri Novem mestu“ in z nekodiranim šumnikom, kar je iskanje
   * lahko razrešilo v napačno Stražo.
   */
  mapsUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`,

  /**
   * Google Maps z že izračunano potjo do naslova. Izhodišče prepusti
   * napravi, zato uporabnik dobi navodila od tam, kjer je.
   */
  directionsUrl: `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`,

  coordinates: { lat: 45.79, lng: 15.13 },
};
