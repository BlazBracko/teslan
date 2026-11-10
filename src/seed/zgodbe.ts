/**
 * Zgodbe izdelkov (dolg opis na podstrani izdelka). Osnutki: lastnik jih v
 * adminu dopolni ali zamenja (polje „Dolg opis“). Seed jih vpiše v nove
 * baze, migracija `zgodbe_izdelkov` pa v obstoječe, kjer je opis prazen.
 *
 * Besedila ne trdijo ničesar, česar ne vemo zagotovo (npr. načina
 * pridelave ali porekla surovin): opisujejo okus, uporabo in kmetijo.
 */
export const ZGODBE: Record<string, string[]> = {
  sparglji: [
    "Ko se aprila zemlja v Podgori ogreje, iz nje pokukajo prvi šparglji. Od takrat do junija jih pobiramo vsako jutro, ročno, enega po enega, ko so še hladni od noči. Zato so tako sočni in nežni.",
    "Najboljši so preprosti: nekaj minut na žaru ali v ponvi, kapljica olja in ščepec soli. Pripravimo jih za prevzem na kmetiji, da do vas pridejo isti dan, kot smo jih nabrali.",
  ],
  redkvica: [
    "Redkvica je prva, ki pove, da se je začela sezona na vrtu. Raste hitro, zato jo sejemo v več delih in pobiramo sproti, ko je najbolj hrustljava.",
    "Narezana na tanke kolute z maslom na svežem kruhu je preprost zajtrk, ki ga pri nas jemo vso pomlad.",
  ],
  jagode: [
    "Jagode v Podgori zorijo počasi, na soncu, dokler niso rdeče do peclja. Nabiramo jih zjutraj, ko so plodovi trdni in dišeči, in jih ponudimo še isti dan.",
    "Ker so najboljše sveže, jih ne pošiljamo. Pridite ponje na kmetijo, pokusite jih na licu mesta in odnesite domov polno košarico za sladico, marmelado ali kar tako.",
  ],
  cesen: [
    "Česen posadimo jeseni in ga pustimo prezimiti v zemlji. Poleti ga izkopljemo, povežemo v šope in posušimo pod streho, kjer dobi svoj močan, oster okus.",
    "Na kmetiji ga ponudimo v sezoni, ko je najlepši. Je osnova domače kuhinje, od juhe do pečenke, in shrani se dolgo v zimo.",
  ],
  krompir: [
    "Krompir izkopljemo pozno poleti in jeseni, ko ima lupina čas, da se utrdi. Gojimo več sort, zato se najde pravi za vsako jed: za pire, pečen krompir ali solato.",
    "Prodajamo ga na kmetiji, kjer si ga izberete sami. Shranjen v temnem in hladnem prostoru zdrži vso zimo.",
  ],
  "cesen-v-prahu": [
    "Kar česna ne porabimo svežega, olupimo, narežemo in počasi posušimo, nato zmeljemo v fin prah. V kozarčku ostane ves njegov okus, le lupljenja in lepljivih prstov ni več.",
    "Ščepec v juho, omako ali marinado je dovolj. Je priročna rešitev za vsakdanjo kuho in lepo darilo za vse, ki radi kuhajo.",
  ],
  "sparglji-v-prahu": [
    "Šparglji v prahu so naša posebnost. Ko je sezona na vrhuncu in jih je več, kot jih lahko prodamo sveže, jih posušimo in zmeljemo. Tako okus pomladi ostane z nami vse leto.",
    "Dodajte ga rižoti, juhi ali skutnemu namazu in jed bo nežno zadišala po špargljih, tudi decembra.",
  ],
  "cebula-v-prahu": [
    "Čebulo narežemo, počasi posušimo in zmeljemo. Brez solz, brez rezanja, a z vsem okusom, ki ga čebula da jedi.",
    "Primerna je za omake, golaže, juhe in marinade, kjer želite enakomeren okus brez koščkov.",
  ],
  "paradiznik-v-prahu": [
    "Paradižnik v prahu je zgoščeno poletje. Zrel paradižnik posušimo in zmeljemo, da ostane le njegov sladko kisli okus.",
    "Žlička v omaki za testenine, juhi ali namazu naredi čudeže, posebej pozimi, ko svežega paradižnika ni.",
  ],
  "suhi-petersilj": [
    "Peteršilj porežemo, ko so listi najbolj dišeči, in ga posušimo na nizki temperaturi, da obdrži barvo in vonj.",
    "Pred uporabo ga zdrobite med prsti nad krožnikom: juha, krompir ali jajčne jedi dobijo svežo zeleno noto.",
  ],
  "cebulni-cips": [
    "Čebulni čips je nastal po naključju, ko smo iskali, kaj narediti z odvečno čebulo. Tanke rezine posušimo do hrustljavega, tako da postanejo sladkaste in polne okusa.",
    "Je prigrizek za med delom, posip po solati ali juhi in presenečenje za vse, ki ga poskusijo prvič.",
  ],
  "jajca-kokosja": [
    "Jajca z domačega dvorišča poberemo vsak dan in jih pakiramo po deset. Tako so vedno sveža, za vsakdanjo kuho, palačinke in pecivo.",
    "Naročite jih na spletu in prevzemite na kmetiji, ko pridete po ostale dobrote.",
  ],
  "jajca-prepelicja": [
    "Prepeličja jajca so drobna, pikasta in vsako je malo drugačno. Okus imajo bolj poln kot kokošja, zato so priljubljena za predjedi.",
    "Kuhana tri minute, olupljena in razpolovljena so lep okras krožnika ali solate.",
  ],
  "vlozena-prepelicja-jajca": [
    "Prepeličja jajca skuhamo, olupimo in vložimo po domačem receptu. Lupljenja, ki je pri tako drobnih jajcih najzahtevnejše, ste tako rešeni.",
    "Postrezite jih s hladnimi predjedmi, narezkom ali kot prigrizek ob kozarcu vina.",
  ],
  "liofilizirane-jagode-breskve": [
    "Liofilizacija sadju vzame vodo, okus in barvo pa pusti. Jagode in breskve ostanejo lahke in hrustljave, kot bi grizli sadni čips.",
    "Potresite jih po kosmičih, jogurtu ali torti, ali pa jih jejte kar iz kozarca.",
  ],
  "liofilizirane-borovnice": [
    "Liofilizirane borovnice so cel sadež, ki mu je bila odvzeta voda. Ostanejo okrogle, hrustljave in temno modre, z vsem okusom gozdne borovnice.",
    "Odlične so v müsliju, pecivu ali kot zdrav prigrizek za na pot.",
  ],
  "liofilizirane-mix": [
    "Mešanica liofiliziranega sadja je za tiste, ki se ne morejo odločiti. V enem kozarcu je več vrst sadja, vsako s svojim okusom.",
    "Je priročna za zajtrk, za v šolo ali službo in za pohode, ker je lahka in se ne pokvari.",
  ],
  "liofilizirane-maline": [
    "Maline so po liofilizaciji še bolj izrazite: kiselkaste, sladke in tako dišeče, da napolnijo kuhinjo, ko odprete kozarec.",
    "Zdrobite jih v kremo, čokolado ali smuti, ali okrasite torto, ki jo boste podarili.",
  ],
  "fizol-liofiliziran": [
    "Liofiliziran fižol je kuhan fižol, ki smo mu odvzeli vodo. Tako je pripravljen v nekaj minutah, brez namakanja in dolgega kuhanja.",
    "Prelijte ga z vročo vodo, počakajte in dodajte v enolončnico, solato ali namaz. Primeren je tudi za izlete in kampiranje.",
  ],
  "marmelada-borovnica": [
    "Borovničevo marmelado kuhamo v manjših količinah, počasi in z veliko sadja, tako kot so jo kuhale naše babice.",
    "Namažite jo na topel kruh, z njo napolnite palačinke ali jo postrezite k siru. Kozarec z rdečo pentljo je tudi lepo darilo.",
  ],
  "vlozeni-jurcki": [
    "Jurčki so kralji gozda. Ko jih je dovolj, jih očistimo, narežemo in vložimo, da njihov okus ostane z nami vse leto.",
    "Postrezite jih kot predjed, k mesu ali jih dodajte testeninam in rižoti.",
  ],
  "testenine-s-sparglji": [
    "Testenine s šparglji povezujejo dve stvari, ki jih imamo radi: testenine in naše šparglje. Šparglji dajo testu nežno zeleno barvo in subtilen okus.",
    "Skuhajte jih in prelijte s stopljenim maslom in parmezanom. Več ne potrebujejo.",
  ],
  "bucno-olje": [
    "Bučno olje je temno zeleno, gosto in dišeče po praženih bučnih semenih. Je pravi okus severovzhoda Slovenije, ki ga imamo radi tudi na Dolenjskem.",
    "Uporabite ga hladnega: na solati, v bučni juhi, na vanilijevem sladoledu ali na kruhu s ščepcem soli.",
  ],
  "olivno-olje": [
    "Olivno olje je v naši kuhinji vsak dan, zato ga ponudimo tudi vam. Ima svež, sadežen okus, ki se lepo ujame z zelenjavo z naših njiv.",
    "Najboljše je hladno: na solati, na pečeni zelenjavi ali na kruhu.",
  ],
  "aronija-sok": [
    "Aronija je majhna temna jagoda z izrazitim, rahlo trpkim okusom. Iz nje stisnemo sok, ki je temen kot črnilo in poln okusa.",
    "Razredčite ga z vodo po okusu in ga pijte zjutraj ali ga dodajte smutiju.",
  ],
};
