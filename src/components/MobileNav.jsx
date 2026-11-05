import { Link } from 'react-router-dom'

export default function MobileNav() {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-800 flex justify-around items-center py-2 px-1 z-50 text-xs shadow-2xl">
      <Link to="/" className="flex flex-col items-center text-gray-300 hover:text-indigo-400 p-1">
        <span className="text-lg"></span>
        <span className="mt-0.5 text-[10px]">Etusivu</span>
      </Link>
      <Link to="/search" className="flex flex-col items-center text-gray-300 hover:text-indigo-400 p-1">
        <span className="text-lg"></span>
        <span className="mt-0.5 text-[10px]">Haku</span>
      </Link>
      <Link to="/favorites" className="flex flex-col items-center text-gray-300 hover:text-indigo-400 p-1">
        <span className="text-lg"></span>
        <span className="mt-0.5 text-[10px]">Suosikit</span>
      </Link>
      <Link to="/groups" className="flex flex-col items-center text-gray-300 hover:text-indigo-400 p-1">
        <span className="text-lg"></span>
        <span className="mt-0.5 text-[10px]">Ryhmät</span>
      </Link>
      <Link to="/profile" className="flex flex-col items-center text-gray-300 hover:text-indigo-400 p-1">
        <span className="text-lg"></span>
        <span className="mt-0.5 text-[10px]">Profiili</span>
      </Link>
    </nav>
  )
}