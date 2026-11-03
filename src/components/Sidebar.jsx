import { Link } from 'react-router-dom'

export default function Sidebar() {
  return (
    <aside className="flex flex-col w-64 bg-gray-900 text-gray-300 border-r border-gray-800 h-screen shrink-0">
      
      {/* 1. Logo vie etusivulle */}
      <Link 
        to="/" 
        className="p-5 border-b border-gray-800 flex items-center gap-3 hover:bg-gray-800/50 transition group cursor-pointer"
      >
        <span className="text-2xl group-hover:scale-110 transition-transform"></span>
        <h1 className="text-lg font-bold tracking-wider text-white group-hover:text-indigo-400 transition">
          apple_master
        </h1>
      </Link>

      {/* Sivupalkin rullattava sisältö */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        
        {/* 2. Oma profiili */}
        <div>
          <Link 
            to="/profile" 
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
          </Link>
        </div>

        {/* 3. Ryhmät */}
        <div>
          <h3 className="text-xs uppercase tracking-wider text-gray-500 font-semibold mb-3 px-3">
            Ryhmät
          </h3>
          <ul className="space-y-1">
            <li>
              <Link to="/groups" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-800 text-gray-300 transition">
                 Omat ryhmät
              </Link>
            </li>
            <li>
              <Link to="/groups/browse" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-800 text-gray-300 transition">
                 Selaa ryhmiä
              </Link>
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
              <Link to="/favorites" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-800 text-gray-300 transition">
                 Suosikit
              </Link>
            </li>
            <li>
              <Link to="/watchlist" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-800 text-gray-300 transition">
                 Katselulista
              </Link>
            </li>
          </ul>
        </div>

      </div>

      {/* 5. Asetukset-painike alhaalla */}
      <div className="p-4 border-t border-gray-800">
        <Link 
          to="/settings" 
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-800 text-gray-300 hover:text-white transition group"
        >
          <span className="text-lg group-hover:rotate-145 transition-transform duration-1000">⚙️</span>
          <span className="text-sm font-medium">Asetukset</span>
        </Link>
      </div>
    </aside>
  )
}