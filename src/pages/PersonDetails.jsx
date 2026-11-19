import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import axios from 'axios'
import MovieDetailsSkeleton from '../components/MovieDetailsSkeleton'
import { CalendarIcon, CrossIcon, PinIcon } from '../components/Icons'

export default function PersonDetails() {
  const { id } = useParams()
  const [person, setPerson] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchPersonDetails = async () => {
      setLoading(true)
      setError(null)

      try {
        const response = await axios.get(`/api/people/${id}`)
        setPerson(response.data)
      } catch (err) {
        console.error('Virhe haettaessa henkilön tietoja:', err)
        setError('Henkilön tietojen lataaminen epäonnistui. Tarkista, että backend on päällä.')
      } finally {
        setLoading(false)
      }
    }

    if (id) fetchPersonDetails()
  }, [id])

  if (loading) return <MovieDetailsSkeleton />

  if (error) {
    return (
      <div className="max-w-xl mx-auto p-8 text-center">
        <p className="text-red-500 mb-4">{error}</p>
        <Link
          to="/search"
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
        >
          Takaisin hakuun
        </Link>
      </div>
    )
  }

  if (!person) return null

  return (
    <div className="max-w-4xl mx-auto p-6 text-gray-800 dark:text-white">
      <Link
        to={-1}
        className="text-sm bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 px-4 py-2 rounded-lg text-indigo-600 dark:text-indigo-400 font-semibold transition mb-6 inline-flex items-center gap-2 cursor-pointer"
      >
        ← Takaisin
      </Link>

      <div className="flex flex-col md:flex-row gap-8 bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
        {person.profile_path ? (
          <img
            src={`https://image.tmdb.org/t/p/w500${person.profile_path}`}
            alt={person.name}
            className="w-full md:w-72 aspect-[2/3] rounded-xl object-cover shadow-md bg-gray-200 dark:bg-gray-700"
          />
        ) : (
          <div className="w-full md:w-72 aspect-[2/3] bg-gray-200 dark:bg-gray-700 rounded-xl flex items-center justify-center text-5xl font-bold text-gray-500 dark:text-gray-400">
            {person.name?.charAt(0) || '?'}
          </div>
        )}

        <div className="flex-1">
          <h1 className="text-3xl font-bold mb-2">{person.name}</h1>

          {person.known_for_department && (
            <p className="text-indigo-600 dark:text-indigo-400 font-semibold mb-4">
              {person.known_for_department}
            </p>
          )}

          <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-300 mb-6">
            {person.birthday && <span className="flex items-center gap-1.5"><CalendarIcon /> Syntynyt {person.birthday}</span>}
            {person.deathday && <span className="flex items-center gap-1.5"><CrossIcon /> Kuollut {person.deathday}</span>}
            {person.place_of_birth && <span className="flex items-center gap-1.5"><PinIcon /> {person.place_of_birth}</span>}
          </div>

          {person.homepage && (
            <a
              href={person.homepage}
              target="_blank"
              rel="noreferrer"
              className="inline-block mb-6 text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              Kotisivut
            </a>
          )}

          <h2 className="text-lg font-semibold mb-2">Elämäkerta</h2>
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line">
            {person.biography || 'Ei elämäkertaa saatavilla.'}
          </p>
        </div>
      </div>

      {person.movieCredits?.length > 0 && (
        <section className="mt-8">
          <h2 className="text-2xl font-bold mb-4">Näyttelijäelokuvat</h2>
          <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory">
            {person.movieCredits.map((movie) => (
              <Link
                key={movie.credit_id || movie.id}
                to={`/movie/${movie.id}`}
                className="w-36 md:w-44 shrink-0 snap-start bg-white dark:bg-gray-800 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 hover:border-indigo-500 transition"
              >
                <img
                  src={`https://image.tmdb.org/t/p/w342${movie.poster_path}`}
                  alt={movie.title}
                  className="w-full h-64 object-cover"
                />
                <div className="p-3">
                  <h3 className="font-semibold text-sm truncate">{movie.title}</h3>
                  {movie.character && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">
                      {movie.character}
                    </p>
                  )}
                  {movie.release_date && (
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      {movie.release_date.split('-')[0]}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
