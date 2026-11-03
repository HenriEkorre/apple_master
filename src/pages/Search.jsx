import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import axios from 'axios'

export default function Search() {
  const [searchParams] = useSearchParams()
  const searchQuery = searchParams.get('q') || ''
  
  const [movies, setMovies] = useState([]) // tänne tallennetaan hausta saadut elokuvat
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  //tää useeffect suoritetaan aina kun hakutermi searchquery muuttuu
  useEffect(() => {
    // jos haku on tyhjä, tyhjennetään tulokset eikä tehdä turhia verkkokutsuja
    if (!searchQuery.trim()) {
      setMovies([])
      return
    }
    // asynkroninen funktio backend pyyntöjä varten
    const fetchSearchResults = async () => {
      setLoading(true)
      setError(null)
      
      try {
        // get pyyntö backendille porttiin 3000
        const response = await axios.get(`http://localhost:3000/api/movies/search?q=${encodeURIComponent(searchQuery)}`)
        console.log('Backendin palauttama data:', response.data)
        // Otetaan huomioon, palauttaako backend suoraan taulukon vai objektin ja tallennetaan elokuvat stateen
        setMovies(response.data.results || response.data)
      } catch (err) {
        console.error('Virhe haussa:', err)
        setError('Elokuvien hakeminen epäonnistui. Tarkista, että backend on päällä ja portti on oikein.')
      } finally {
        setLoading(false)
      }
    }

    fetchSearchResults()
  }, [searchQuery]) // koodi ajetaan uudestaan aina kun käyttäjä tekee uuden haun

  return (
    <div className="p-6 text-white max-w-7xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">Elokuvahaku</h2>

      {searchQuery && (
        <p className="mb-6 text-gray-400">
          Hakutulokset sanalle: <span className="text-white font-semibold">"{searchQuery}"</span>
        </p>
      )}

      {/* Lataus- ja virhetilat */}
      {loading && (
        <div className="flex justify-center my-12">
          <p className="text-indigo-400 animate-pulse text-lg">Etsitään elokuvia...</p>
        </div>
      )}

      {error && (
        <div className="bg-red-900/50 border border-red-700 p-4 rounded-lg mb-6 text-red-200">
          {error}
        </div>
      )}

      {/* Elokuvakorttien ruudukko */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
        {!loading && movies.map((movie) => (
          <div 
            key={movie.id} 
            className="bg-gray-800 rounded-xl overflow-hidden shadow-lg hover:scale-105 transition-transform duration-200 border border-gray-700/50 flex flex-col"
          >
            {movie.poster_path ? (
              <img 
                src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`} 
                alt={movie.title || movie.name} 
                className="w-full h-64 object-cover"
              />
            ) : (
              <div className="w-full h-64 bg-gray-700 flex items-center justify-center text-gray-400 text-sm">
                Ei kuvaa
              </div>
            )}
            <div className="p-3 flex flex-col justify-between flex-grow">
              <h3 className="font-semibold text-sm truncate text-white">{movie.title || movie.name}</h3>
              <p className="text-xs text-gray-400 mt-1">
                {movie.release_date ? movie.release_date.split('-')[0] : (movie.first_air_date ? movie.first_air_date.split('-')[0] : 'Ei vuotta')}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Ei tuloksia -ilmoitus */}
      {!loading && searchQuery && movies.length === 0 && !error && (
        <p className="text-gray-400 mt-6">Ei löytynyt elokuvia tällä hakusanalla.</p>
      )}
    </div>
  )
}