import { Link, useLocation } from 'react-router-dom'

export default function MobileNav() {
  const location = useLocation()

  // Apufunktio tyylien tarkistukseen
  const isActive = (path) => {
    if (path === '/groups') return location.pathname.startsWith('/groups')
    return location.pathname === path
  }

  const navItems = [
    { path: '/', label: 'Etusivu' },
    { path: '/profile', label: 'Profiili' },
    { path: '/groups', label: 'Ryhmät' },
    { path: '/favorites', label: 'Suosikit' }
  ]

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-gray-900/95 backdrop-blur-md border-t border-gray-800/80 flex justify-around items-center h-14 px-2 z-50 shadow-2xl">
      {navItems.map((item) => {
        const active = isActive(item.path)

        return (
          <Link
            key={item.path}
            to={item.path}
            className={`relative flex flex-col items-center justify-center w-full h-full transition-all duration-200 ${
              active 
                ? 'text-white font-semibold' 
                : 'text-gray-400 hover:text-gray-200 font-medium'
            }`}
          >
            {/* pieni korostusviiva aktiivisen kohdan yläreunassa */}
            {active && (
              <span className="absolute top-0 w-8 h-[2px] bg-indigo-500 rounded-full shadow-[0_0_8px_rgba(99,102,241,0.6)]" />
            )}
            
            {/* teksti tyyliteltynä */}
            <span className={`text-[11px] tracking-tight transition-transform ${active ? 'scale-105' : ''}`}>
              {item.label}
            </span>
          </Link>
        )
      })}
    </nav>
  )
}