import axios from 'axios'

// Kontrollerifunktio suosittujen elokuvien hakemiseen TMDB:stä
const getPopularMovies = async (req, res, next) => {
  try {
    const apiKey = process.env.TMDB_API_KEY
    
    // Tehdään GET-pyyntö TMDB:n popular-rajapintaan
    const response = await axios.get('https://api.themoviedb.org/3/movie/popular', {
      params: {
        api_key: apiKey,
        language: 'fi-FI'
      }
    })
    
    // Palautetaan elokuvataulukko eteenpäin asiakkaalle
    res.status(200).json(response.data.results || [])
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

    // Tehdään GET-pyyntö TMDB:n search/movie-rajapintaan
    const response = await axios.get('https://api.themoviedb.org/3/search/movie', {
      params: {
        api_key: apiKey,
        query: queryTerm,
        language: 'fi-FI'
      }
    })

    // Palautetaan hakutulokset eteenpäin
    res.status(200).json(response.data.results || [])
  } catch (error) {
    // Siirretään virhe eteenpäin virheenkäsittelijälle
    next(error)
  }
}

export {
  getPopularMovies,
  searchMovies
}