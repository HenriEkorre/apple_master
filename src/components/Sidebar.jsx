export default function Sidebar() {
  return (
    <aside className="flex flex-col w-64 bg-gray-900 text-gray-300 border-r border-gray-800 h-screen shrink-0">
      
      {/* 1. Sivuston Logo / Nimi - Toimii linkkinä / painikkeena etusivulle */}
      <a 
        href="#" 
        className="p-5 border-b border-gray-800 flex items-center gap-3 hover:bg-gray-800/50 transition group cursor-pointer"
      >
        <span className="text-2xl group-hover:scale-110 transition-transform"></span>
        <h1 className="text-lg font-bold tracking-wider text-white group-hover:text-indigo-400 transition">
          apple_master
        </h1>
      </a>

      {/* Sivupalkin rullattava sisältö */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        
        {/* 2. Oma profiili */}
        <div>
          <a 
            href="#" 
            className="flex items-center gap-3 p-2.5 rounded-xl bg-gray-800/60 hover:bg-gray-800 transition border border-gray-700/50 group"
          >
            <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-white shrink-0 shadow-inner group-hover:bg-indigo-500 transition">
              MM
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-semibold text-white truncate group-hover:text-indigo-300 transition">
                Matti Meikäläinen
              </h4>
              <p className="text-xs text-gray-400 truncate">Oma profiili</p>
            </div>
          </a>
        </div>



        {/* 3. Ryhmät */}
        <div>
          <h3 className="text-xs uppercase tracking-wider text-gray-500 font-semibold mb-3 px-3">
            Ryhmät
          </h3>
          <ul className="space-y-1">
            <li>
              <a href="#" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-800 text-gray-300 transition">
                 Omat ryhmät
              </a>
            </li>
            <li>
              <a href="#" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-800 text-gray-300 transition">
                 Selaa ryhmiä
              </a>
            </li>
          </ul>
        </div>

        {/* 4. Elokuvalistat */}
        <div>
          <h3 className="text-xs uppercase tracking-wider text-gray-500 font-semibold mb-3 px-3">
            Elokuvalistat
          </h3>
          <ul className="space-y-1">
            <li>
              <a href="#" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-800 text-gray-300 transition">
                 Suosikit
              </a>
            </li>
            <li>
              <a href="#" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-800 text-gray-300 transition">
                 Katselulista
              </a>
            </li>
            <li>
              <a href="#" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-800 text-gray-300 transition">
                 Luo uusi lista
              </a>
            </li>
          </ul>
        </div>

      </div>
    {/* 5. Asetukset-painike aivan sivupalkin pohjalla */}
      <div className="p-4 border-t border-gray-800">
        <a 
          href="#" 
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-800 text-gray-300 hover:text-white transition group"
        >
          <span className="text-lg group-hover:rotate-45 transition-transform duration-300">⚙️</span>
          <span className="text-sm font-medium">Asetukset</span>
        </a>
      </div>
    </aside>
  )
}