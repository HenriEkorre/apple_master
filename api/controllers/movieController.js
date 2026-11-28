import axios from 'axios'
import { pool } from '../models/db.js'

const attachReviewRatings = async (movies, userId) => {
  if (movies.length === 0) return movies

  const result = await pool.query(
    `WITH friend_reviewers AS (
       SELECT DISTINCT gm_other.user_id
       FROM group_members gm_me
       JOIN group_members gm_other ON gm_other.group_id = gm_me.group_id
       WHERE gm_me.user_id = $2
         AND gm_me.status = 'active'
         AND gm_other.status = 'active'
         AND gm_other.user_id <> $2
     )
     SELECT r.tmdb_movie_id,
            ROUND(AVG(r.rating), 1)::float8 AS global_review_average,
            COUNT(*)::int AS global_review_count,
            ROUND(AVG(r.rating) FILTER (
              WHERE friend_reviewers.user_id IS NOT NULL
            ), 1)::float8 AS friends_average,
            COUNT(*) FILTER (
              WHERE friend_reviewers.user_id IS NOT NULL
            )::int AS friends_review_count
     FROM reviews r
     LEFT JOIN friend_reviewers ON friend_reviewers.user_id = r.user_id
     WHERE r.tmdb_movie_id = ANY($1::int[])
       AND r.visibility = 'public'
     GROUP BY r.tmdb_movie_id`,
    [movies.map((movie) => movie.id), userId]
  )

  const ratingsByMovieId = new Map(
    result.rows.map((row) => [row.tmdb_movie_id, row])
  )

  return movies.map((movie) => {
    const ratings = ratingsByMovieId.get(movie.id)
    return {
      ...movie,
      global_review_average: ratings?.global_review_average ?? null,
      global_review_count: ratings?.global_review_count ?? 0,
      friends_average: ratings?.friends_average ?? null,
      friends_review_count: ratings?.friends_review_count ?? 0,
    }
  })
}

// Kontrollerifunktio suosittujen elokuvien hakemiseen TMDB:stä
const getPopularMovies = async (req, res, next) => {
  try {
    const apiKey = process.env.TMDB_API_KEY

    // Tehdään GET-pyyntö TMDB:n popular-rajapintaan
    const response = await axios.get(
      'https://api.themoviedb.org/3/movie/popular',
      {
        params: {
          api_key: apiKey,
          language: 'fi-FI',
        },
      },
    )

    const movies = await attachReviewRatings(
      response.data.results || [],
      req.user?.id ?? null
    )
    res.status(200).json(movies)
  } catch (error) {
    // Siirretään virhe eteenpäin virheenkäsittelijälle (errorHandler)
    next(error)
  }
}

// Kontrollerifunktio elokuvien hakuun hakutermin perusteella
const searchMovies = async (req, res, next) => {
  try {
    const apiKey = process.env.TMDB_API_KEY
    const queryTerm = req.query.q // Otetaan hakutermi URL-parametrista

    // Tarkistetaan, että hakutermi on annettu
    if (!queryTerm) {
      return res.status(400).json({ error: 'Hakutermi (q) puuttuu' })
    }

    const response = await axios.get(
      'https://api.themoviedb.org/3/search/movie',
      {
        params: {
          api_key: apiKey,
          query: queryTerm,
          language: 'fi-FI',
        },
      },
    )
    res.status(200).json(response.data.results || [])
  } catch (error) {
    // Siirretään virhe eteenpäin virheenkäsittelijälle
    next(error)
  }
}

// Hae yksittäisen elokuvan tiedot ID:n perusteella
const getMovieDetails = async (req, res, next) => {
  try {
    const apiKey = process.env.TMDB_API_KEY
    const movieId = req.params.id // Ottaa elokuvan ID:n URL-osoitteesta

    const movieResponse = await axios.get(
      `https://api.themoviedb.org/3/movie/${movieId}`,
      {
        params: {
          api_key: apiKey,
          language: 'fi-FI',
        },
      },
    )

    // Haetaan erillisellä kutsulla Youtube-trailerit
    const videosResponse = await axios.get(
      `https://api.themoviedb.org/3/movie/${movieId}/videos`,
      {
        params: {
          api_key: apiKey,
          language: 'en-US', // Videotiedot haetaan englanniksi, koska trailerit voivat olla kansainvälisiä
        },
      },
    )

    const videos = videosResponse.data.results || []

    const trailer =
      videos.find(
        (video) =>
          video.site === 'YouTube' &&
					video.type === 'Trailer' &&
					video.iso_639_1 === 'fi', // TMDB:n videodatan kieli
      ) ||
			videos.find(
			  (video) => video.site === 'YouTube' && video.type === 'Trailer',
			) ||
			videos.find(
			  (video) => video.site === 'YouTube' && video.type === 'Teaser',
			)

    res.status(200).json({
      ...movieResponse.data,
      trailer: trailer
        ? {
          name: trailer.name,
          key: trailer.key,
          embedUrl: `https://www.youtube-nocookie.com/embed/${trailer.key}`,
        }
        : null,
    })
  } catch (error) {
    next(error)
  }
}

// Kontrollerifunktio parhaiten arvioitujen elokuvien hakemiseen TMDB:stä
const getTopRatedMovies = async (req, res, next) => {
  try {
    const apiKey = process.env.TMDB_API_KEY

    // Tehdään GET-pyyntö TMDB:n top_rated-rajapintaan
    const response = await axios.get(
      'https://api.themoviedb.org/3/movie/top_rated',
      {
        params: {
          api_key: apiKey,
          language: 'fi-FI',
        },
      },
    )

    const movies = await attachReviewRatings(
      response.data.results || [],
      req.user?.id ?? null
    )
    res.status(200).json(movies)
  } catch (error) {
    // Siirretään virhe eteenpäin virheenkäsittelijälle (errorHandler)
    next(error)
  }
}

export { getPopularMovies, getTopRatedMovies, searchMovies, getMovieDetails }
