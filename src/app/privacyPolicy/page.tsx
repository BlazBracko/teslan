export default function PrivacyPolicyPage() {
    return (
      <>
        <main className="bg-gray-50 text-gray-900 min-h-screen py-16">
          <div className="max-w-4xl mx-auto px-6 sm:px-8 lg:px-12">
            <h1 className="text-4xl font-bold text-center mb-8">Politika zasebnosti</h1>
            
            <section className="space-y-6 text-lg text-gray-700">
              <p>
                Ta pravilnik o zasebnosti opisuje, kako Kmetija Tešlan (v nadaljevanju: "mi") zbira, uporablja in varuje vaše osebne podatke, 
                ko uporabljate našo spletno stran in stopite v stik z nami prek kontaktnega obrazca.
              </p>
    
              <h2 className="text-2xl font-semibold mt-6">1. Upravljavec osebnih podatkov</h2>
              <p>
                Upravljavec vaših osebnih podatkov je:<br />
                <strong>Kmetija Tešlan</strong><br />
                Podgora 15, 8000 Novo mesto, Dolenjska<br />
                E-mail: <a href="mailto:sandi@dercar.com" className="text-orange-600 hover:underline">sandi@dercar.com</a><br />
                Telefon: <a href="tel:+19172678533" className="text-orange-600 hover:underline">+1 917 267 8533</a>
              </p>
    
              <h2 className="text-2xl font-semibold mt-6">2. Katere podatke zbiramo?</h2>
              <p>Zbiramo le osebne podatke, ki nam jih posredujete preko kontaktnega obrazca:</p>
              <ul className="list-disc list-inside space-y-2">
                <li>Ime in priimek</li>
                <li>E-poštni naslov</li>
                <li>Vsebina vašega sporočila</li>
              </ul>
    
              <h2 className="text-2xl font-semibold mt-6">3. Namen zbiranja podatkov</h2>
              <p>Vaše podatke uporabljamo izključno za odgovor na vaše povpraševanje ali sporočilo.</p>
    
              <h2 className="text-2xl font-semibold mt-6">4. Kako dolgo hranimo vaše podatke?</h2>
              <p>Vaše osebne podatke hranimo le toliko časa, kot je potrebno za odgovor na vaše sporočilo, nato jih izbrišemo.</p>
    
              <h2 className="text-2xl font-semibold mt-6">5. Kako varujemo vaše podatke?</h2>
              <p>Uporabljamo ustrezne varnostne ukrepe za zaščito vaših osebnih podatkov pred nepooblaščenim dostopom, razkritjem ali izgubo.</p>
    
              <h2 className="text-2xl font-semibold mt-6">6. Pravice uporabnikov</h2>
              <p>V skladu z GDPR imate pravico do:</p>
              <ul className="list-disc list-inside space-y-2">
                <li>dostopa do svojih podatkov,</li>
                <li>popravka napačnih podatkov,</li>
                <li>izbrisa svojih podatkov,</li>
                <li>omejitve obdelave,</li>
                <li>ugovora obdelavi.</li>
              </ul>
              <p>
                Če želite uveljavljati katero koli od teh pravic, nas kontaktirajte na{' '}
                <a href="mailto:sandi@dercar.com" className="text-orange-600 hover:underline">sandi@dercar.com</a>.
              </p>
    
              <h2 className="text-2xl font-semibold mt-6">7. Spremembe pravilnika</h2>
              <p>Ta pravilnik se lahko občasno posodobi. Zadnja posodobitev: Marec 2025.</p>
            </section>
          </div>
        </main>
      </>
    );
  }
  