export default function Footer() {
  return (
    <footer className="bg-gray-100 text-gray-900 py-2 w-full text-[11px] sm:text-xs">
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex flex-col sm:flex-row justify-center items-center sm:items-start gap-4 sm:gap-12">
          {/* Naslov */}
          <div className="flex-1 text-center sm:text-left">
            <h4 className="text-[11px] font-semibold mb-1">Naslov</h4>
            <a
              href="https://www.google.com/maps"
              target="_blank"
              className="text-gray-900 hover:text-gray-700"
            >
              Podgora 15, 8351 Straža pri Novem mestu
            </a>
          </div>

          {/* Kontakt */}
          <div className="flex-1 text-center sm:text-left">
            <h4 className="text-[11px] font-semibold mb-1">Kontakt</h4>
            <a
              href="mailto:sandi.dercar@gmail.com"
              className="block text-gray-900 hover:text-gray-700"
            >
              sandi.dercar@gmail.com
            </a>
            <a
              href="tel:+38640578512"
              className="block text-gray-900 hover:text-gray-700"
            >
              +386 40 578 512
            </a>
          </div>
        </div>
      </div>

      {/* Bottom line */}
      <div className="border-t border-gray-300 mt-3 pt-2 text-[10px] text-gray-600 flex flex-col sm:flex-row justify-center items-center space-y-1 sm:space-y-0 sm:space-x-3">
        <span>© 2025 Domačija Tešlan. Vse pravice pridržane.</span>
        <a href="/privacyPolicy" className="hover:text-gray-500">
          Privacy Policy
        </a>
      </div>
    </footer>
  );
}
