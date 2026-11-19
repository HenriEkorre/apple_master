import { useState, useEffect } from 'react'
import { useSearchParams, Link } from 'react-router-dom' 
import axios from 'axios'
import { useAuth } from '../AuthProvider'

export default function Search() {
  const [searchParams] = useSearchParams()
  const searchQuery = searchParams.get('q') || ''
  const { user } = useAuth()
  
  const [movies, setMovies] = useState([])
  const [people, setPeople] = useState([])
  const [groups, setGroups] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [peopleError, setPeopleError] = useState(null)
  const [groupsError, setGroupsError] = useState(null)

  useEffect(() => {
    if (!searchQuery.trim()) {
      setMovies([])
      setPeople([])
      setGroups([])
      setError(null)
      setPeopleError(null)
      setGroupsError(null)
      return
    }

    // Estää vanhentuneen vastauksen ylikirjoittamasta uudempaa hakua
    let cancelled = false

    const fetchAllResults = async () => {
      setLoading(true)
      setError(null)
      setPeopleError(null)
      setGroupsError(null)

      // Haetaan elokuvat, henkilöt ja ryhmät rinnakkain
      const moviesRequest = axios.get(
        `/api/movies/search?q=${encodeURIComponent(searchQuery)}`
      )

      const peopleRequest = axios.get(
        `/api/people/search?q=${encodeURIComponent(searchQuery)}`
      )

      // Ryhmähaku vaatii kirjautumisen
      const groupsRequest = user
        ? axios.get(`/api/groups/search?q=${encodeURIComponent(searchQuery)}`, {
            withCredentials: true,
          })
        : Promise.resolve(null)

      const [movieResult, peopleResult, groupResult] = await Promise.allSettled([
        moviesRequest,
        peopleRequest,
        groupsRequest,
      ])

      if (cancelled) return

      // 1. Elokuvat
      if (movieResult.status === 'fulfilled') {
        const movieData = movieResult.value.data
        setMovies(movieData.results || movieData)
      } else {
        console.error('Virhe elokuvahaussa:', movieResult.reason)
        setMovies([])
        setError('Hakutulosten hakeminen epäonnistui.')
      }

      // 2. Henkilöt
      if (peopleResult.status === 'fulfilled') {
        const peopleData = peopleResult.value.data
        setPeople(peopleData.results || peopleData)
      } else {
        console.error('Virhe henkilöhaussa:', peopleResult.reason)
        setPeople([])
        setPeopleError('Henkilöiden hakeminen epäonnistui.')
      }

      // 3. Ryhmät
      if (groupResult.status === 'fulfilled') {
        setGroups(groupResult.value ? groupResult.value.data : [])
      } else {
        console.error('Virhe ryhmähaussa:', groupResult.reason)
        setGroups([])
        setGroupsError('Ryhmien hakeminen epäonnistui.')
      }

      setLoading(false)
    }

    fetchAllResults()

    return () => {
      cancelled = true
    }
  }, [searchQuery, user?.id])

  return (
    <div className="p-4 md:p-6 text-gray-900 dark:text-white max-w-7xl mx-auto">
      <h2 className="text-2xl font-bold mb-2">Hakutulokset</h2>
      {searchQuery && (
        <p className="mb-8 text-gray-600 dark:text-gray-400 text-sm">
          Haulla: <span className="text-gray-900 dark:text-white font-semibold">"{searchQuery}"</span>
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

      {peopleError && (
        <div className="bg-red-900/50 border border-red-700 p-4 rounded-lg mb-6 text-red-200 text-sm">
          {peopleError}
        </div>
      )}

      {groupsError && (
        <div className="bg-red-900/50 border border-red-700 p-4 rounded-lg mb-6 text-red-200 text-sm">
          {groupsError}
        </div>
      )}

      {/* Ryhmähaku vaatii kirjautumisen */}
      {!user && searchQuery && !loading && (
        <div className="bg-gray-100 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700/50 p-4 rounded-lg mb-6 text-gray-600 dark:text-gray-300 text-sm">
          Kirjaudu sisään nähdäksesi myös ryhmähaun tulokset.
        </div>
      )}

      {/* --- ELOKUVAT -TULOKSET --- */}
      {!loading && movies.length > 0 && (
        <div className="mb-10">
          <h3 className="text-lg font-bold mb-4 text-indigo-600 dark:text-indigo-400 border-b border-gray-200 dark:border-gray-800 pb-2">Elokuvat ({movies.length})</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {movies.map((movie) => (
              <Link 
                key={movie.id} 
                to={`/movie/${movie.id}`}
                className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-lg hover:scale-105 transition-all duration-200 border border-gray-200 dark:border-gray-700/50 flex flex-col group block"
              >
                {movie.poster_path ? (
                  <img 
                    src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`} 
                    alt={movie.title || movie.name} 
                    className="w-full h-64 object-cover"
                  />
                ) : (
                  <div className="w-full h-64 bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-500 dark:text-gray-400 text-xs">
                    Ei kuvaa
                  </div>
                )}
                <div className="p-3 flex flex-col justify-between flex-grow">
                  <h3 className="font-semibold text-sm truncate text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    {movie.title || movie.name}
                  </h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    {movie.release_date ? movie.release_date.split('-')[0] : 'Ei vuotta'}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* --- HENKILÖT JA RYHMÄT -TULOKSET --- */}
      {!loading && (people.length > 0 || groups.length > 0) && (
        <section className="border-t border-gray-200 dark:border-gray-800 pt-8">
          <h3 className="text-lg font-bold mb-5 text-indigo-600 dark:text-indigo-400">Henkilöt ja ryhmät</h3>

          {people.length > 0 && (
            <div className="mb-7">
              <h4 className="text-sm font-semibold mb-3 text-gray-700 dark:text-gray-300">Henkilöt ({people.length})</h4>
              <div className="flex gap-4 overflow-x-auto pb-3 snap-x snap-mandatory">
                {people.map((person) => (
                  <Link
                    key={person.id}
                    to={`/person/${person.id}`}
                    className="w-36 md:w-40 shrink-0 snap-start bg-white dark:bg-gray-800 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700/50"
                  >
                    {person.profile_path ? (
                      <img
                        src={`https://image.tmdb.org/t/p/w185${person.profile_path}`}
                        alt={person.name}
                        className="w-full h-52 object-cover"
                      />
                    ) : (
                      <div className="w-full h-52 bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-3xl font-bold text-gray-500 dark:text-gray-400">
                        {person.name?.charAt(0) || '?'}
                      </div>
                    )}
                    <div className="p-3">
                      <h5 className="font-semibold text-sm text-gray-900 dark:text-white truncate">{person.name}</h5>
                      {person.known_for_department && (
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{person.known_for_department}</p>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {groups.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold mb-3 text-gray-700 dark:text-gray-300">Ryhmät ({groups.length})</h4>
              <div className="flex gap-4 overflow-x-auto pb-3 snap-x snap-mandatory">
                {groups.map((group) => (
                  <Link
                    key={group.id}
                    to={`/groups/${group.id}`}
                    className="w-72 shrink-0 snap-start bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700/50 rounded-xl p-4 hover:border-indigo-500 transition block group"
                  >
                    <h5 className="font-bold text-base text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition mb-1">
                      {group.name}
                    </h5>
                    <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2 mb-3">
                      {group.description || 'Ei kuvausta'}
                    </p>
                    <div className="flex justify-between items-center text-xs text-gray-600 dark:text-gray-500">
                      <span className="capitalize px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-900">
                        {group.type === 'closed' ? 'closed · kutsulla' : group.type}
                      </span>
                      <span>{group.member_count ?? 0} jäsentä</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {/* Ei mitään tuloksia */}
      {!loading && searchQuery && movies.length === 0 && people.length === 0 && groups.length === 0 && !error && !peopleError && !groupsError && (
        <p className="text-gray-600 dark:text-gray-400 text-sm mt-6">Ei löytynyt elokuvia, henkilöitä tai ryhmiä hakusanalla "{searchQuery}".</p>
      )}

      {!searchQuery && !loading && (
        <p className="text-gray-600 dark:text-gray-400 text-sm mt-4">Kirjoita hakusana hakeaksesi elokuvia, henkilöitä ja ryhmiä.</p>
      )}
    </div>
  )
}
