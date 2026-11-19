import axios from 'axios'

export const searchPeople = async (req, res, next) => {
  try {
    const apiKey = process.env.TMDB_API_KEY
    const queryTerm = req.query.q

    if (!queryTerm) {
      return res.status(400).json({ error: 'Hakutermi (q) puuttuu' })
    }

    const response = await axios.get(
      'https://api.themoviedb.org/3/search/person',
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
    next(error)
  }
}

export const getPersonDetails = async (req, res, next) => {
  try {
    const apiKey = process.env.TMDB_API_KEY
    const personId = req.params.id
    const detailsUrl = `https://api.themoviedb.org/3/person/${personId}`
    const creditsUrl = `https://api.themoviedb.org/3/person/${personId}/movie_credits`

    const [detailsResponse, creditsResponse] = await Promise.all([
      axios.get(detailsUrl, {
        params: {
          api_key: apiKey,
          language: 'fi-FI',
        },
      }),
      axios.get(creditsUrl, {
        params: {
          api_key: apiKey,
          language: 'fi-FI',
        },
      }),
    ])

    const cast = Array.isArray(creditsResponse.data?.cast)
      ? creditsResponse.data.cast
        .filter((movie) => movie.poster_path)
        .sort((a, b) => (b.release_date || '').localeCompare(a.release_date || ''))
      : []

    res.status(200).json({
      ...detailsResponse.data,
      movieCredits: cast,
    })
  } catch (error) {
    next(error)
  }
}
