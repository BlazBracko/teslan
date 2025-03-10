export default function Footer() {
    return (
      <footer className="bg-gray-100 text-gray-900 py-12 w-full">
        <div className="max-w-6xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-12">
            <div>
              <h4 className="text-2xl font-semibold mb-4">Naslov</h4>
              <a href="https://www.google.com/maps/place/Podgora+15,+8351+Stra%C5%BEa+pri+Novem+mestu/@45.8032346,15.0955932,588m/data=!3m2!1e3!4b1!4m6!3m5!1s0x4764fe137ed84b29:0xff27e748e298b39d!8m2!3d45.8032346!4d15.0955932!16s%2Fg%2F11c1fnqvmp?entry=ttu&g_ep=EgoyMDI1MDMwNC4wIKXMDSoASAFQAw%3D%3D" target="_blank" className="text-gray-900 hover:text-gray-700">
                Podgora 15, 8000 Novo mesto, Dolenjska
              </a>
            </div>
            <div>
              <h4 className="text-2xl font-semibold mb-4">Kontakt</h4>
              <a href="mailto:sandi.dercar@gmail.com?subject=Contact" className="text-gray-900 hover:text-gray-700">
                sandi.dercar@gmail.com
              </a>
              <p><a href="tel:+19172678533" className="text-gray-900 hover:text-gray-700">+1 917 267 8533</a></p>
            </div>
          </div>
        </div>
        <div className="border-t border-gray-300 mt-12 pt-4 text-sm text-gray-600 flex justify-center items-center space-x-2">
          <span>© 2025 Kmetija Tešlan. Vse pravice pridržane.</span>
          <a href="/privacyPolicy" className="hover:text-gray-500">Privacy Policy</a>
        </div>
      </footer>
    );
  }
  