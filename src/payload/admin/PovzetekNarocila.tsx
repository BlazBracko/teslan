import { formatirajCeno } from "@/lib/denar";

type Postavka = {
  id?: string | null;
  tip?: string | null;
  ime?: string | null;
  velikost?: string | null;
  kolicina?: number | null;
  cenaCenti?: number | null;
  vsebina?: Array<{ id?: string | null; ime?: string | null; velikost?: string | null; kolicina?: number | null }> | null;
  sporociloNaKartici?: string | null;
};

type PodatkiNarocila = {
  kupec?: { ime?: string | null; priimek?: string | null; email?: string | null; telefon?: string | null } | null;
  postavke?: Postavka[] | null;
  postninaCenti?: number | null;
  skupajCenti?: number | null;
  nacinDostave?: string | null;
};

const evri = (centi: number | null | undefined) => (Number.isInteger(centi) ? formatirajCeno(centi as number) : "–");

/**
 * Pregleden povzetek na vrhu naročila (polje vrste `ui`, ne shrani se):
 * kaj pripraviti, komu in koliko stane, v evrih namesto centov. Podrobni
 * posnetek ob oddaji je spodaj v zloženem razdelku.
 */
export function PovzetekNarocila({ data }: { data?: PodatkiNarocila }) {
  const postavke = data?.postavke ?? [];
  if (postavke.length === 0) return null;
  const kupec = data?.kupec;
  const ime = [kupec?.ime, kupec?.priimek].filter(Boolean).join(" ");

  return (
    <section className="teslan-povzetek" aria-label="Povzetek naročila">
      <div className="teslan-povzetek__kupec">
        <strong>{ime || "Kupec"}</strong>
        {kupec?.telefon ? <a href={`tel:${kupec.telefon.replace(/\s+/g, "")}`}>{kupec.telefon}</a> : null}
        {kupec?.email ? <a href={`mailto:${kupec.email}`}>{kupec.email}</a> : null}
      </div>
      <table className="teslan-povzetek__tabela">
        <thead>
          <tr>
            <th scope="col">Kaj pripraviti</th>
            <th scope="col" className="teslan-desno">
              Količina
            </th>
            <th scope="col" className="teslan-desno">
              Cena
            </th>
            <th scope="col" className="teslan-desno">
              Skupaj
            </th>
          </tr>
        </thead>
        <tbody>
          {postavke.map((p, i) => (
            <tr key={p.id ?? i}>
              <td>
                <strong>{p.ime}</strong>
                {p.velikost ? <span className="teslan-povzetek__velikost"> · {p.velikost}</span> : null}
                {p.tip === "skatla" && p.vsebina?.length ? (
                  <ul className="teslan-povzetek__vsebina">
                    {p.vsebina.map((v, j) => (
                      <li key={v.id ?? j}>
                        {v.kolicina} × {v.ime}
                        {v.velikost ? `, ${v.velikost}` : ""}
                      </li>
                    ))}
                  </ul>
                ) : null}
                {p.sporociloNaKartici ? (
                  <p className="teslan-povzetek__sporocilo">Na kartico: „{p.sporociloNaKartici}“</p>
                ) : null}
              </td>
              <td className="teslan-desno">{p.kolicina}</td>
              <td className="teslan-desno">{evri(p.cenaCenti)}</td>
              <td className="teslan-desno">
                {Number.isInteger(p.cenaCenti) && Number.isInteger(p.kolicina)
                  ? evri((p.cenaCenti as number) * (p.kolicina as number))
                  : "–"}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          {data?.nacinDostave === "posta" ? (
            <tr>
              <th scope="row" colSpan={3}>
                Poštnina
              </th>
              <td className="teslan-desno">{evri(data?.postninaCenti)}</td>
            </tr>
          ) : null}
          <tr className="teslan-povzetek__skupaj">
            <th scope="row" colSpan={3}>
              Skupaj za plačilo
            </th>
            <td className="teslan-desno">{evri(data?.skupajCenti)}</td>
          </tr>
        </tfoot>
      </table>
    </section>
  );
}
