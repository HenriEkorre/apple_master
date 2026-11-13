import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import axios from 'axios'
import { useTheme } from '../ThemeProvider'
import { useAuth } from '../AuthProvider'

export default function Header({ onOpenAuth }) {
  const [query, setQuery] = useState('')
  const [movieSuggestions, setMovieSuggestions] = useState([])
  const [groupSuggestions, setGroupSuggestions] = useState([])
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()

  // Live-haku: hakee elokuvat ja ryhmät backendistä kun query muuttuu
  useEffect(() => {
    const trimmedQuery = query.trim()

    if (trimmedQuery === '') {
      setMovieSuggestions([])
      setGroupSuggestions([])
      return
    }

    // Estää vanhentuneen vastauksen ylikirjoittamasta uudempaa hakua
    let cancelled = false

    const delayDebounceFn = setTimeout(() => {
      // 1. Hae elokuvat backendistä (max 3 kpl)
      axios
        .get(`/api/movies/search?q=${encodeURIComponent(trimmedQuery)}`)
        .then((response) => {
          if (cancelled) return
          const results = response.data.results || response.data
          setMovieSuggestions(results.slice(0, 3))
        })
        .catch((error) => {
          console.error('Virhe ehdotusten haussa:', error)
        })

      // 2. Hae ryhmät backendistä (max 3 kpl). Ryhmähaku vaatii kirjautumisen.
      if (user) {
        axios
          .get(`/api/groups/search?q=${encodeURIComponent(trimmedQuery)}&limit=3`, {
            withCredentials: true,
          })
          .then((response) => {
            if (cancelled) return
            setGroupSuggestions(response.data.slice(0, 3))
          })
          .catch((error) => {
            console.error('Virhe ryhmäehdotusten haussa:', error)
            if (!cancelled) setGroupSuggestions([])
          })
      } else {
        setGroupSuggestions([])
      }
    }, 300)

    return () => {
      cancelled = true
      clearTimeout(delayDebounceFn)
    }
  }, [query, user?.id])

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
    <header className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 z-30 px-4 md:px-6 py-4 flex items-center justify-between gap-3">
      {/* 1. Logo / Teksti */}
      <Link
        to="/"
        className="md:hidden font-bold text-sm tracking-wider text-gray-900 dark:text-white shrink-0 hover:text-indigo-500 transition"
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
            <svg
              className="size-5 fill-none stroke-current"
              viewBox="0 0 24 24"
              strokeWidth="2"
              aria-hidden="true"
            >
              <circle cx="11" cy="11" r="6" />
              <path d="m16 16 4 4" />
            </svg>
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
                        {group.type === 'closed' ? 'Suljettu · ' : ''}
                        {group.description || 'Ei kuvausta'}
                      </p>
                    </div>
                    <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded font-semibold shrink-0">
                      {group.member_count ?? 0} jäs.
                    </span>
                  </Link>
                ))}
              </div>
            )}

          </div>
        )}
      </div>

      {/* Teeman vaihto & käyttäjän painikkeet */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={toggleTheme}
          className="rounded-lg p-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
        >
          <svg
            className="size-5 fill-current"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            {theme === 'dark' ? (
              <path d="M12.7 2.1a9.5 9.5 0 1 0 9.2 12.1A8 8 0 0 1 12.7 2.1Z" />
            ) : (
              <path d="M12 2a1 1 0 0 1 1 1v2a1 1 0 1 1-2 0V3a1 1 0 0 1 1-1Zm0 16a1 1 0 0 1 1 1v2a1 1 0 1 1-2 0v-2a1 1 0 0 1 1-1ZM4.93 3.51l1.41 1.42a1 1 0 1 1-1.41 1.41L3.51 4.93a1 1 0 0 1 1.42-1.42ZM17.66 17.66a1 1 0 0 1 1.41 0l1.42 1.41a1 1 0 0 1-1.42 1.42l-1.41-1.42a1 1 0 0 1 0-1.41ZM2 12a1 1 0 0 1 1-1h2a1 1 0 1 1 0 2H3a1 1 0 0 1-1-1Zm16 0a1 1 0 0 1 1-1h2a1 1 0 1 1 0 0 1 0 1 0 2h-2a1 1 0 0 1-1-1ZM4.93 20.49a1 1 0 0 1-1.42-1.42l1.42-1.41a1 1 0 1 1 1.41 1.41l-1.41 1.42ZM19.07 3.51a1 1 0 0 1 0 1.42l-1.42 1.41a1 1 0 0 1-1.41-1.41l1.41-1.42ZM12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10Z" />
            )}
          </svg>
        </button>

        {user && (
          <button
            type="button"
            onClick={logout}
            className="shrink-0 rounded-lg bg-gray-700 px-3 py-2 text-sm text-white hover:bg-gray-600"
          >
            Kirjaudu ulos
          </button>
        )}
      </div>
    </header>
  )
}
