import React, { useState, useEffect } from 'react'
import MovieRow from '../components/MovieRow'

export default function Home() {
  const [popularMovies, setPopularMovies] = useState([])
  const [topRatedMovies, setTopRatedMovies] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    Promise.all([
      fetch('/api/movies/popular'),
      fetch('/api/movies/top-rated'),
    ])
      .then(async ([popularRes, topRatedRes]) => {
        if (!popularRes.ok || !topRatedRes.ok) {
          throw new Error('Elokuvien haku backendistä epäonnistui')
        }

        const [popularData, topRatedData] = await Promise.all([
          popularRes.json(),
          topRatedRes.json(),
        ])

        setPopularMovies(popularData)
        setTopRatedMovies(topRatedData)
        setLoading(false)
      })
      .catch((err) => {
        console.error('Virhe:', err)
        setError(err.message)
        setLoading(false)
      })
  }, [])

  return (
    <div className="space-y-8 pb-20 md:pb-8">
      <MovieRow
        title="Suositut elokuvat"
        movies={popularMovies}
        loading={loading}
        error={error}
      />

      <MovieRow
        title="Parhaiten arvioidut"
        movies={topRatedMovies}
        loading={loading}
        error={error}
      />
    </div>
  )
}