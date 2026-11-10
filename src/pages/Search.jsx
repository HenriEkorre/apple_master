import { useState, useEffect } from 'react'
import { useSearchParams, Link } from 'react-router-dom' 
import axios from 'axios'
import { getStoredGroups } from '../mocks/groupStorage'

export default function Search() {
  const [searchParams] = useSearchParams()
  const searchQuery = searchParams.get('q') || ''
  
  const [movies, setMovies] = useState([])
  const [groups, setGroups] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!searchQuery.trim()) {
      setMovies([])
      setGroups([])
      return
    }

    const fetchAllResults = async () => {
      setLoading(true)
      setError(null)
      
      try {
        const queryLower = searchQuery.toLowerCase()

        // 1. Haetaan elokuvat backendistä
        const movieResponse = await axios.get(`/api/movies/search?q=${encodeURIComponent(searchQuery)}`)
        const movieResults = movieResponse.data.results || movieResponse.data
        setMovies(movieResults)

        // 2. Haetaan ja suodatetaan ryhmät paikallisesta muistista
        const allGroups = getStoredGroups()
        const matchingGroups = allGroups.filter(g => 
          g.name.toLowerCase().includes(queryLower) || 
          (g.description && g.description.toLowerCase().includes(queryLower))
        )
        setGroups(matchingGroups)

      } catch (err) {
        console.error('Virhe haussa:', err)
        setError('Hakutulosten hakeminen epäonnistui.')
      } finally {
        setLoading(false)
      }
    }

    fetchAllResults()
  }, [searchQuery])

  return (
    <div className="p-4 md:p-6 text-white max-w-7xl mx-auto">
      <h2 className="text-2xl font-bold mb-2">Hakutulokset</h2>
      {searchQuery && (
        <p className="mb-8 text-gray-400 text-sm">
          Haulla: <span className="text-white font-semibold">"{searchQuery}"</span>
        </p>
      )}

      {loading && (
        <div className="flex justify-center my-12">
          <p className="text-indigo-400 animate-pulse text-sm">Etsitään tuloksia...</p>
        </div>
      )}

      {error && (
        <div className="bg-red-900/50 border border-red-700 p-4 rounded-lg mb-6 text-red-200 text-sm">
          {error}
        </div>
      )}

      {/* --- RYHMÄT -TULOKSET --- */}
      {!loading && groups.length > 0 && (
        <div className="mb-10">
          <h3 className="text-lg font-bold mb-4 text-indigo-400 border-b border-gray-800 pb-2">Ryhmät ({groups.length})</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {groups.map(group => (
              <Link 
                key={group.id} 
                to={`/groups/${group.id}`}
                className="bg-gray-800 border border-gray-700/50 rounded-xl p-4 hover:border-indigo-500 transition block group"
              >
                <h4 className="font-bold text-base text-white group-hover:text-indigo-400 transition mb-1">{group.name}</h4>
                <p className="text-xs text-gray-400 line-clamp-2 mb-3">{group.description || 'Ei kuvausta'}</p>
                <div className="flex justify-between items-center text-xs text-gray-500">
                  <span className="capitalize px-2 py-0.5 rounded bg-gray-900">{group.type}</span>
                  <span>{group.members ? group.members.length : 1} jäsentä</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* --- ELOKUVAT -TULOKSET --- */}
      {!loading && movies.length > 0 && (
        <div>
          <h3 className="text-lg font-bold mb-4 text-indigo-400 border-b border-gray-800 pb-2">Elokuvat ({movies.length})</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {movies.map((movie) => (
              <Link 
                key={movie.id} 
                to={`/movie/${movie.id}`}
                className="bg-gray-800 rounded-xl overflow-hidden shadow-lg hover:scale-105 transition-all duration-200 border border-gray-700/50 flex flex-col group block"
              >
                {movie.poster_path ? (
                  <img 
                    src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`} 
                    alt={movie.title || movie.name} 
                    className="w-full h-64 object-cover"
                  />
                ) : (
                  <div className="w-full h-64 bg-gray-700 flex items-center justify-center text-gray-400 text-xs">
                    Ei kuvaa
                  </div>
                )}
                <div className="p-3 flex flex-col justify-between flex-grow">
                  <h3 className="font-semibold text-sm truncate text-white group-hover:text-indigo-400 transition-colors">
                    {movie.title || movie.name}
                  </h3>
                  <p className="text-xs text-gray-400 mt-1">
                    {movie.release_date ? movie.release_date.split('-')[0] : 'Ei vuotta'}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Ei mitään tuloksia */}
      {!loading && searchQuery && movies.length === 0 && groups.length === 0 && !error && (
        <p className="text-gray-400 text-sm mt-6">Ei löytynyt elokuvia tai ryhmiä hakusanalla "{searchQuery}".</p>
      )}

      {!searchQuery && !loading && (
        <p className="text-gray-400 text-sm mt-4">Kirjoita hakusana hakeaksesi elokuvia ja ryhmiä.</p>
      )}
    </div>
  )
}