import axios from 'axios'

const tmdbApiKey = () => process.env.TMDB_API_KEY

export const getPopularMovies = async () => {
  const response = await axios.get(
    'https://api.themoviedb.org/3/movie/popular',
    {
      params: {
        api_key: tmdbApiKey(),
        language: 'fi-FI',
      },
    },
  )
  return response.data.results || []
}

export const searchMovies = async (queryTerm) => {
  const response = await axios.get(
    'https://api.themoviedb.org/3/search/movie',
    {
      params: {
        api_key: tmdbApiKey(),
        query: queryTerm,
        language: 'fi-FI',
      },
    },
  )
  return response.data.results || []
}

export const getMovieDetails = async (movieId) => {
  const [movieResponse, videosResponse] = await Promise.all([
    axios.get(
      `https://api.themoviedb.org/3/movie/${movieId}`,
      {
        params: {
          api_key: tmdbApiKey(),
          language: 'fi-FI',
        },
      },
    ),
    axios.get(
      `https://api.themoviedb.org/3/movie/${movieId}/videos`,
      {
        params: {
          api_key: tmdbApiKey(),
          language: 'en-US',
        },
      },
    ),
  ])
  return {
    movie: movieResponse.data,
    videos: videosResponse.data.results || [],
  }
}

export const searchPeople = async (queryTerm) => {
  const response = await axios.get(
    'https://api.themoviedb.org/3/search/person',
    {
      params: {
        api_key: tmdbApiKey(),
        query: queryTerm,
        language: 'fi-FI',
      },
    },
  )
  return response.data.results || []
}

export const getPersonDetails = async (personId) => {
  const [detailsResponse, creditsResponse] = await Promise.all([
    axios.get(
      `https://api.themoviedb.org/3/person/${personId}`,
      {
        params: {
          api_key: tmdbApiKey(),
          language: 'fi-FI',
        },
      },
    ),
    axios.get(
      `https://api.themoviedb.org/3/person/${personId}/movie_credits`,
      {
        params: {
          api_key: tmdbApiKey(),
          language: 'fi-FI',
        },
      },
    ),
  ])
  return {
    details: detailsResponse.data,
    cast: creditsResponse.data?.cast || [],
  }
}
