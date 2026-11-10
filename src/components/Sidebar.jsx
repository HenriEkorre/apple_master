import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { getStoredGroups } from '../mocks/groupStorage'

export default function Sidebar() {
  const [myGroups, setMyGroups] = useState([])
  const location = useLocation()

  useEffect(() => {
    const loadMyGroups = () => {
      const allGroups = getStoredGroups()
      setMyGroups(allGroups.filter(g => g.isMember))
    }

    loadMyGroups()
    window.addEventListener('focus', loadMyGroups)
    return () => window.removeEventListener('focus', loadMyGroups)
  }, [location.pathname])

  const isActive = (path) => location.pathname === path

  return (
    <aside className="hidden md:flex flex-col w-64 bg-gray-900 text-gray-300 border-r border-gray-800 h-screen shrink-0 select-none">
      
      {/* 1. Logo / Otsikko */}
      <Link 
        to="/" 
        className="p-5 border-b border-gray-800 flex items-center gap-3 hover:bg-gray-800/50 transition group"
      >
        <span className="text-base font-bold tracking-wider text-white group-hover:text-indigo-400 transition">
          apple_master
        </span>
      </Link>

      {/* Rullattava pääsisältö */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        
        {/* Käyttäjäprofiili */}
        <div>
          <Link 
            to="/profile" 
            className="flex items-center gap-3 p-3 rounded-xl bg-gray-800/50 hover:bg-gray-800 transition border border-gray-700/40 group"
          >
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center font-semibold text-white text-sm shrink-0 group-hover:bg-indigo-500 transition shadow-inner">
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

        {/* Ryhmät */}
        <div>
          <div className="flex items-center justify-between mb-2 px-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">
              Ryhmät
            </h3>
            <Link to="/groups" className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold transition">
              Hallinnoi
            </Link>
          </div>

          <ul className="space-y-1 mb-3">
            <li>
              <Link 
                to="/groups" 
                className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition ${
                  isActive('/groups') 
                    ? 'bg-indigo-600 text-white font-semibold' 
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                }`}
              >
                Omat ryhmät
              </Link>
            </li>
            <li>
              <Link 
                to="/groups/browse" 
                className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition ${
                  isActive('/groups/browse') 
                    ? 'bg-indigo-600 text-white font-semibold' 
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                }`}
              >
                Selaa ryhmiä
              </Link>
            </li>
          </ul>

          {/* Omat ryhmät -lista */}
          <div className="pl-2 space-y-1 border-l border-gray-800 ml-3">
            {myGroups.length > 0 ? (
              myGroups.map((group) => {
                const isGroupActive = location.pathname === `/groups/${group.id}`

                return (
                  <Link
                    key={group.id}
                    to={`/groups/${group.id}`}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs md:text-sm transition group ${
                      isGroupActive 
                        ? 'bg-indigo-500/20 text-indigo-300 font-semibold border border-indigo-500/30' 
                        : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold shrink-0 transition ${
                      isGroupActive ? 'bg-indigo-600 text-white' : 'bg-gray-800 text-gray-400 group-hover:bg-gray-700'
                    }`}>
                      {group.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="truncate">{group.name}</span>
                  </Link>
                )
              })
            ) : (
              <p className="px-3 py-1.5 text-xs text-gray-500 italic">
                Ei ryhmäjäsenyyksiä.
              </p>
            )}
          </div>
        </div>

        {/* Elokuvalistat */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2 px-3">
            Elokuvalistat
          </h3>
          <ul className="space-y-1">
            <li>
              <Link 
                to="/favorites" 
                className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition ${
                  isActive('/favorites') ? 'bg-indigo-600 text-white font-semibold' : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                }`}
              >
                Suosikit
              </Link>
            </li>
            <li>
              <Link 
                to="/watchlist" 
                className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition ${
                  isActive('/watchlist') ? 'bg-indigo-600 text-white font-semibold' : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                }`}
              >
                Katselulista
              </Link>
            </li>
          </ul>
        </div>
      </div>

      {/* Asetukset alhaalla */}
      <div className="p-3 border-t border-gray-800">
        <Link 
          to="/settings" 
          className={`flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition ${
            isActive('/settings') ? 'bg-indigo-600 text-white font-semibold' : 'text-gray-300 hover:bg-gray-800 hover:text-white'
          }`}
        >
          Asetukset
        </Link>
      </div>
    </aside>
  )
}