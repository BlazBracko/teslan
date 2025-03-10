export default function Footer() {
    return (
      <footer className="bg-gray-100 text-gray-900 py-6 w-full"> {/* Zmanjšana višina */}
        <div className="max-w-6xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8"> {/* Zmanjšan razmik med kolonami */}
            <div>
              <h4 className="text-xl font-semibold mb-2">Naslov</h4> {/* Zmanjšan naslov */}
              <a
                href="https://www.google.com/maps"
                target="_blank"
                className="text-gray-900 hover:text-gray-700"
              >
                Podgora 15, 8000 Novo mesto, Dolenjska
              </a>
            </div>
            <div>
              <h4 className="text-xl font-semibold mb-2">Kontakt</h4> {/* Zmanjšan naslov */}
              <a
                href="mailto:sandi.dercar@gmail.com"
                className="text-gray-900 hover:text-gray-700"
              >
                sandi.dercar@gmail.com
              </a>
              <p>
                <a
                  href="tel:+19172678533"
                  className="text-gray-900 hover:text-gray-700"
                >
                  +1 917 267 8533
                </a>
              </p>
            </div>
          </div>
        </div>
        <div className="border-t border-gray-300 mt-8 pt-2 text-xs sm:text-xs text-gray-600 flex flex-col sm:flex-row justify-center items-center space-y-1 sm:space-y-0 sm:space-x-2"> {/* Zmanjšan prostor in besedilo */}
          <span>© 2025 Kmetija Tešlan. Vse pravice pridržane.</span>
          <a href="/privacyPolicy" className="hover:text-gray-500">
            Privacy Policy
          </a>
        </div>
      </footer>
    );
  }
  