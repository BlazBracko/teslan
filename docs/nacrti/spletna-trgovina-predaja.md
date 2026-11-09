# Predaja: kaj čaka na lastnika

Sproten seznam manjkajočih zunanjih ključev, preskočenih preizkusov in opravil, ki zahtevajo lastnikovo roko (načrt §11). Vsak korak K1–K13 dopiše svoje. K13 ga dokonča v kontrolni seznam.

## Manjkajoči ključi in nastavitve

| Kaj | Potrebno od | Nadomestek do takrat | Kje nastaviti |
|---|---|---|---|
| — | — | — | — |

## Preskočeni preizkusi

| Preizkus | Razlog | Kaj ga omogoči |
|---|---|---|
| — | — | — |

## Dnevnik po korakih

### K1 Temelji
- Ni novih zunanjih ključev; nobena spremenljivka še ni obvezna (`OBVEZNE_V_PRODUKCIJI` v `src/env.ts` je prazen). K3 doda `DATABASE_URL` in `PAYLOAD_SECRET`, zato morata biti od K3 naprej nastavljena v Railway staging okolju, sicer se strežnik ne zažene.
- Ni preskočenih preizkusov.
- GitHub secrets za CI zaenkrat niso potrebni (Stripe test ključ je neobvezen, K8).
