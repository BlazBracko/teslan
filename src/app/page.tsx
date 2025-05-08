import { FaMapPin } from 'react-icons/fa';

export default function HomePage() {
  return (
    <main className="bg-gray-50 text-gray-900">
      <section
        className="relative bg-fixed bg-cover bg-center h-[500px] md:h-[400px] lg:h-[350px]"
        style={{ backgroundImage: 'url(./home2.jpg)' }}
      > 
        <div className="absolute inset-0 bg-black opacity-50"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight mb-3 drop-shadow-lg">
            Dobrodošli na Domačijo Tešlan
          </h1>
          <p className="text-base sm:text-lg text-white mb-5 drop-shadow-md">
            Skrbno pridelana hrana, neposredno iz naše kmetije na vaše mize.
          </p>
          <a
            href="/products"
            className="inline-block px-5 py-2 bg-orange-500 text-white font-medium rounded-md hover:bg-orange-600 transition-all duration-300 shadow-md"
          >
            Preverite ponudbo
          </a>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
        <section className="text-center max-w-2xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">Domačija Tešlan</h2>
          <p className="text-sm sm:text-base text-gray-700 mb-3 text-justify leading-relaxed">
            Kmetija Tešlan se nahaja na čudovitem območju Dolenjske, v vasi Podgora. Naša kmetija ponuja širok spekter lokalno pridelanih proizvodov in ekološko pridelane hrane, ki jo prodajamo neposredno strankam. Pri nas boste našli sveže zelenjavne in sadne pridelke ter druge lokalne dobrote, vse pridelane z ljubeznijo in skrbnostjo.
          </p>
          <p className="text-sm sm:text-base text-gray-700 text-justify leading-relaxed">
            Naša misija je podpirati trajnostno kmetijstvo in ohranjanje okolja, ob tem pa nuditi kakovostno hrano in prijazno izkušnjo za obiskovalce.
          </p>
          <div className="flex items-center justify-center mt-4 space-x-2 text-gray-700">
            <FaMapPin className="text-lg text-red-400" />
            <p className="text-sm sm:text-base">
              <strong>Naš naslov:</strong> Podgora 15, 8351 Straža pri Novem mestu
            </p>
          </div>
        </section>

        {/* <section id="kontakt" className="bg-white p-5 rounded-lg shadow max-w-xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 text-center">Kontaktirajte nas</h2>
          <ContactForm />
        </section> */}
      </div>
      {/* 📸 FULL WIDTH GALLERY */}
      {/* <section className="w-full">
        <GallerySlider />
      </section> */}
    </main>
  );
}
