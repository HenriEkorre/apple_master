import axios from 'axios'

const getPopularMovies = async (req, res, next) => {
  try {
    const apiKey = process.env.TMDB_API_KEY
    
    // Tehdään pyyntö TMDB API:hin
    const response = await axios.get('https://api.themoviedb.org/3/movie/popular', {
      params: {
        api_key: apiKey,
        language: 'fi-FI'
      }
    })

    // Palautetaan elokuvien tulokset eteenpäin JSON-muodossa
    res.status(200).json(response.data.results || [])
  } catch (error) {
    next(error) // Ohjaa virheen virheenkäsittelijälle
  }
}

export {
  getPopularMovies
}