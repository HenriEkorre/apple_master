import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function Header() {
  const [query, setQuery] = useState('')
  const navigate = useNavigate()

  const handleSearch = (e) => {
    e.preventDefault()
    if (!query.trim()) return

    // Ohjaa käyttäjän hakutulossivulle osoitteeseen /search?q=hakutermi
    navigate(`/search?q=${encodeURIComponent(query.trim())}`)
  }

  return (
    <header className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 z-30 px-6 py-4 flex items-center justify-between">
      {/* Käytetään formia, jotta haku aktivoituu myös enteriä painamalla!! */}
      <form onSubmit={handleSearch} className="flex items-center w-full max-w-md">
        <input 
          type="text" 
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Kirjoita elokuvan nimi..." 
          className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <button 
          type="submit"
          className="ml-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition cursor-pointer"
        >
          Hae
        </button>
      </form>
    </header>
  )
}