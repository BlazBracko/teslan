#!/usr/bin/env bash
# Pripravi pisavi identitete (Z1) za `src/app/(frontend)/pisave/` (K13, S18).
#
# Izvor: spremenljivi pisavi Fraunces in Inter iz repozitorija Google Fonts
# (licenca SIL OFL 1.1, besedili licenc sta poleg pisav). Skripta:
#  - Fraunces zamrzne os SOFT na 50 (mehki rezi) in WONK na 0, obdrži
#    optično velikost (9–144) in težo 400–700;
#  - Inter obdrži optično velikost (14–32) in težo 400–700;
#  - obe omeji na latinico z razširitvijo A (č, š, ž, ć, đ …), ločila, € in
#    puščice ter na uporabljene OpenType funkcije.
# Rezultat je ena datoteka na družino (~75 KB in ~50 KB namesto ~250 KB pri
# Google Fonts z vsemi osmi in podmnožicami).
#
# Zahteve: python3 s paketoma fonttools in brotli (pip install fonttools brotli).
# Uporaba: scripts/pripravi-pisave.sh
set -euo pipefail

CILJ="$(cd "$(dirname "$0")/.." && pwd)/src/app/(frontend)/pisave"
DELO="$(mktemp -d)"
trap 'rm -rf "$DELO"' EXIT

IZVOR="https://github.com/google/fonts/raw/main/ofl"
curl -fsSL -o "$DELO/Fraunces.ttf" "$IZVOR/fraunces/Fraunces%5BSOFT,WONK,opsz,wght%5D.ttf"
curl -fsSL -o "$DELO/Inter.ttf" "$IZVOR/inter/Inter%5Bopsz,wght%5D.ttf"
curl -fsSL -o "$CILJ/OFL-Fraunces.txt" "$IZVOR/fraunces/OFL.txt"
curl -fsSL -o "$CILJ/OFL-Inter.txt" "$IZVOR/inter/OFL.txt"

ZNAKI="U+0020-007E,U+00A0-017F,U+0192,U+02C6-02C7,U+02D8-02DD,U+2010-2027,U+2030-203A,U+2044,U+20AC,U+2122,U+2190-2193,U+2212"
FUNKCIJE="kern,liga,calt,ccmp,locl,mark,mkmk,case,tnum,cv11,ss01"

fonttools varLib.instancer -q -o "$DELO/fraunces.ttf" "$DELO/Fraunces.ttf" opsz=9:144 wght=400:700 SOFT=50 WONK=0
fonttools varLib.instancer -q -o "$DELO/inter.ttf" "$DELO/Inter.ttf" opsz=14:32 wght=400:700

for ime in fraunces inter; do
  pyftsubset "$DELO/$ime.ttf" --unicodes="$ZNAKI" --layout-features="$FUNKCIJE" \
    --flavor=woff2 --output-file="$CILJ/$ime.woff2"
done
ls -l "$CILJ"
