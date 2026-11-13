import React, { useState, useEffect } from 'react'
import MovieCard from '../components/MovieCard'
import MovieCardSkeleton from '../components/MovieCardSkeleton'

export default function Home() {
  const [movies, setMovies] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    // Haetaan data backendistä
    fetch('/api/movies/popular')
      .then((response) => {
        if (!response.ok) {
          throw new Error('Elokuvien haku backendistä epäonnistui')
        }
        return response.json()
      })
      .then((data) => {
        setMovies(data)
        setLoading(false)
      })
      .catch((err) => {
        console.error('Virhe:', err)
        setError(err.message)
        setLoading(false)
      })
  }, [])

  if (loading) {
    return (
      <div aria-busy="true">
        <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white ">
          Suositut elokuvat
        </h2>

        {/* Ruudunlukijoille */}
        <span className="sr-only">Ladataan suosittuja elokuvia...</span>

        {/* Skeleton-kortit samassa ruudukossa kuin oikeat kortit */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-6">
          {Array.from({ length: 10 }).map((_, index) => (
            <MovieCardSkeleton key={index} />
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return <div className="text-red-500 text-center py-10">Virhe: {error}</div>
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white ">
        Suositut elokuvat
      </h2>

      {/* Korttiruudukko */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-6">
        {movies.map((movie) => (
          <MovieCard key={movie.id} movie={movie} />
        ))}
      </div>
    </div>
  )
}
