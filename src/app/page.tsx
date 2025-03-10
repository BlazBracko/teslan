import { ContactForm } from '../components/contant_form';

export default function HomePage() {
  return (
    <main className="bg-gray-50 text-gray-900">
      <section className="relative bg-cover bg-center h-[600px]" style={{ backgroundImage: 'url(./home2.jpg)' }}>
        <div className="absolute inset-0 bg-black opacity-40"></div>
        <div className="relative max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-24 text-center">
          <h1 className="text-5xl font-extrabold text-white leading-tight mb-4 drop-shadow-lg">Dobrodošli na Kmetijo Tešlan</h1>
          <p className="text-xl text-white mb-6 drop-shadow-md">Skrbno pridelana hrana, neposredno iz naše kmetije na vaše mize.</p>
          <a href="/products" className="inline-block px-8 py-3 bg-orange-500 text-white font-semibold rounded-lg hover:bg-orange-600 transition-all duration-300 shadow-md">Preverite ponudbo</a>
        </div>
      </section>
      
      <div className="max-w-6xl mx-auto px-6 sm:px-8 lg:px-12 py-16 space-y-16">
        <section className="text-center max-w-3xl mx-auto">
          <h2 className="text-4xl font-bold text-gray-900 mb-6">Kmetija Tešlan</h2>
          <p className="text-lg text-gray-700 mb-4 text-justify leading-relaxed">
            Kmetija Tešlan se nahaja na čudovitem območju Dolenjske, v vasi Podgora. 
            Naša kmetija ponuja širok spekter lokalno pridelanih proizvodov in ekološko pridelane hrane, 
            ki jo prodajamo neposredno strankam. Pri nas boste našli sveže zelenjavne in sadne pridelke, 
            meso iz lastnih živali ter druge lokalne dobrote, vse pridelane z ljubeznijo in skrbnostjo.
          </p>
          <p className="text-lg text-gray-700 text-justify leading-relaxed">
            Naša misija je podpirati trajnostno kmetijstvo in ohranjanje okolja, ob tem pa nuditi kakovostno 
            hrano in prijazno izkušnjo za obiskovalce.
          </p>
          <div className="flex items-center justify-center mt-6 space-x-3 text-gray-700">
            <p className="text-lg">
              <strong>Naš naslov:</strong> Podgora 15, 8000 Novo mesto, Dolenjska
            </p>
          </div>
        </section>
        <section id="kontakt" className="bg-white p-6 rounded-lg shadow-md max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center">Kontaktirajte nas</h2>
          <ContactForm />
        </section>
      </div>
    </main>
  );
}
