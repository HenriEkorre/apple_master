import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import axios from 'axios'

export default function MovieDetails() {
  // Nappaa elokuvan ID URL-osoitteesta 
  const { id } = useParams()
  
  const [movie, setMovie] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchMovieDetails = async () => {
      setLoading(true)
      setError(null)

      try {
        // Pyydetään backendiltä kyseisen elokuvan tiedot ID:n perusteella
        // Varmista että reitti on tismalleen tämä (/api/movies/:id)
        const response = await axios.get(`/api/movies/${id}`)
        console.log('Elokuvan tiedot:', response.data)
        setMovie(response.data)
      } catch (err) {
        console.error('Virhe haettaessa elokuvan tietoja:', err)
        setError('Elokuvan tietojen lataaminen epäonnistui. Tarkista, että backend on päällä.')
      } finally {
        setLoading(false)
      }
    }

    if (id) {
      fetchMovieDetails()
    }
  }, [id])

  // Näytetään latausteksti, kun tietoja haetaan
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <p className="text-gray-600 dark:text-gray-300 text-lg">Ladataan elokuvan tietoja...</p>
      </div>
    )
  }

  // Jos tulee virhe
  if (error) {
    return (
      <div className="max-w-xl mx-auto p-8 text-center">
        <p className="text-red-500 mb-4">{error}</p>
        <Link to="/search" className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition">
          Takaisin hakuun
        </Link>
      </div>
    )
  }

  if (!movie) return null

  return (
    <div className="max-w-4xl mx-auto p-6 text-gray-800 dark:text-white">
      {/* Linkki jolla pääsee takaisin edelliselle sivulle */}
      <Link to={-1} className="inline-block mb-6 text-indigo-600 dark:text-indigo-400 hover:underline font-medium">
        ← Takaisin
      </Link>

      <div className="flex flex-col md:flex-row gap-8 bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
        {/* Elokuvan juliste */}
        {movie.poster_path ? (
          <img 
            src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`} 
            alt={movie.title} 
            className="w-full md:w-72 rounded-xl object-cover shadow-md"
          />
        ) : (
          <div className="w-full md:w-72 h-96 bg-gray-200 dark:bg-gray-700 rounded-xl flex items-center justify-center text-gray-400">
            Ei kuvaa
          </div>
        )}

        {/* Elokuvan tiedot */}
        <div className="flex-1 flex flex-col justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">{movie.title}</h1>
            
            {movie.tagline && (
              <p className="italic text-gray-500 dark:text-gray-400 mb-4">"{movie.tagline}"</p>
            )}

            {/* Pienet metatiedot: julkaisuvuosi, kesto, arvosana */}
            <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-300 mb-4">
              {movie.release_date && <span>📅 {movie.release_date}</span>}
              {movie.runtime && <span>⏱️ {movie.runtime} min</span>}
              {movie.vote_average && <span>⭐ {movie.vote_average.toFixed(1)} / 10</span>}
            </div>

            {/* Genret badgeina */}
            {movie.genres && movie.genres.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                {movie.genres.map(genre => (
                  <span key={genre.id} className="px-3 py-1 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 text-xs rounded-full font-medium">
                    {genre.name}
                  </span>
                ))}
              </div>
            )}

            <h3 className="text-lg font-semibold mb-2">Juoni</h3>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              {movie.overview || 'Ei juonikuvausta saatavilla.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}