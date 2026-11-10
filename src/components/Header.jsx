import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import axios from 'axios'
import { getStoredGroups } from '../mocks/groupStorage'

export default function Header() {
  const [query, setQuery] = useState('')
  const [movieSuggestions, setMovieSuggestions] = useState([])
  const [groupSuggestions, setGroupSuggestions] = useState([])
  const navigate = useNavigate()

  // Live-haku: tekee pyynnön elokuvista ja suodattaa ryhmät kun query muuttuu
  useEffect(() => {
    const trimmedQuery = query.trim().toLowerCase()

    if (trimmedQuery === '') {
      setMovieSuggestions([])
      setGroupSuggestions([])
      return
    }

    const delayDebounceFn = setTimeout(() => {
      // 1. Hae elokuvat backendistä (max 3 kpl)
      axios.get(`/api/movies/search?q=${encodeURIComponent(query.trim())}`)
        .then((response) => {
          const results = response.data.results || response.data
          setMovieSuggestions(results.slice(0, 3))
        })
        .catch((error) => {
          console.error("Virhe elokuvien ehdotuksissa:", error)
        })

      // 2. Hae ja suodata julkiset ryhmät paikallisesta muistista (max 3 kpl)
      const allGroups = getStoredGroups()
      const matchingGroups = allGroups.filter(g => 
        g.type === 'public' && 
        (g.name.toLowerCase().includes(trimmedQuery) || 
         (g.description && g.description.toLowerCase().includes(trimmedQuery)))
      )
      setGroupSuggestions(matchingGroups.slice(0, 3))

    }, 300)

    return () => clearTimeout(delayDebounceFn)
  }, [query])

  const handleSearch = (e) => {
    e.preventDefault()
    if (!query.trim()) return

    // Ohjataan käyttäjä hakutulossivulle, jossa näkyvät kaikki tulokset
    navigate(`/search?q=${encodeURIComponent(query.trim())}`)

    setMovieSuggestions([])
    setGroupSuggestions([])
    setQuery('')
  }

  const hasSuggestions = movieSuggestions.length > 0 || groupSuggestions.length > 0

  return (
    <header className="sticky top-0 bg-gray-900 border-b border-gray-800 z-30 px-4 md:px-6 py-3.5 flex items-center justify-between gap-3 text-white">
      
      {/* 1. Logo / Teksti */}
      <Link 
        to="/" 
        className="md:hidden font-bold text-sm tracking-wider text-white shrink-0 hover:text-indigo-500 transition"
      >
        apple_master
      </Link>

      {/* 2. Hakukenttä ja live-ehdotukset */}
      <div className="relative flex-1 max-w-md">
        <form onSubmit={handleSearch} className="flex items-center w-full">
          <input 
            type="text" 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Hae elokuvaa tai ryhmää..." 
            className="w-full px-3 py-1.5 md:px-4 md:py-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button 
            type="submit"
            className="ml-2 px-3 py-1.5 md:px-4 md:py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition cursor-pointer shrink-0"
          >
            Hae
          </button>
        </form>

        {/* Live-ehdotukset (Dropdown) */}
        {hasSuggestions && (
          <div className="absolute left-0 right-14 mt-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-2xl overflow-hidden z-50">
            
            {/* ELOKUVAT */}
            {movieSuggestions.length > 0 && (
              <div>
                <div className="px-3 py-1.5 bg-gray-100 dark:bg-gray-800 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  Elokuvat
                </div>
                {movieSuggestions.map((movie) => (
                  <Link
                    key={`movie-${movie.id}`}
                    to={`/movie/${movie.id}`}
                    onClick={() => {
                      setMovieSuggestions([])
                      setGroupSuggestions([])
                      setQuery('')
                    }}
                    className="flex items-center gap-3 p-2.5 hover:bg-gray-100 dark:hover:bg-gray-800 transition border-b border-gray-100 dark:border-gray-800"
                  >
                    <img 
                      src={movie.poster_path ? `https://image.tmdb.org/t/p/w92${movie.poster_path}` : 'https://via.placeholder.com/40x60?text=Ei+kuvaa'} 
                      alt={movie.title}
                      className="w-8 h-12 object-cover rounded shadow"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs md:text-sm font-bold text-gray-900 dark:text-white truncate">{movie.title}</h4>
                      <p className="text-[10px] md:text-xs text-gray-500 dark:text-gray-400">
                        {movie.release_date ? movie.release_date.split('-')[0] : 'Ei vuotta'}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {/* RYHMÄT */}
            {groupSuggestions.length > 0 && (
              <div>
                <div className="px-3 py-1.5 bg-gray-100 dark:bg-gray-800 text-[10px] font-bold text-gray-400 uppercase tracking-wider border-t border-gray-200 dark:border-gray-700">
                  Ryhmät
                </div>
                {groupSuggestions.map((group) => (
                  <Link
                    key={`group-${group.id}`}
                    to={`/groups/${group.id}`}
                    onClick={() => {
                      setMovieSuggestions([])
                      setGroupSuggestions([])
                      setQuery('')
                    }}
                    className="flex items-center justify-between p-2.5 hover:bg-gray-100 dark:hover:bg-gray-800 transition border-b border-gray-100 dark:border-gray-800 last:border-none"
                  >
                    <div className="flex-1 min-w-0 pr-2">
                      <h4 className="text-xs md:text-sm font-bold text-gray-900 dark:text-white truncate">{group.name}</h4>
                      <p className="text-[10px] md:text-xs text-gray-500 dark:text-gray-400 truncate">
                        {group.description || 'Ei kuvausta'}
                      </p>
                    </div>
                    <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded font-semibold shrink-0">
                      {group.members ? group.members.length : 1} jäs.
                    </span>
                  </Link>
                ))}
              </div>
            )}

          </div>
        )}
      </div>

    </header>
  )
}