import {
  getMovieDetails as fetchMovieDetails,
  getPopularMovies as fetchPopularMovies,
  searchMovies as fetchSearchMovies,
} from '../clients/tmdbClient.js'

// Kontrollerifunktio suosittujen elokuvien hakemiseen TMDB:stä
const getPopularMovies = async (req, res, next) => {
  try {
    const movies = await fetchPopularMovies()
    res.status(200).json(movies)
  } catch (error) {
    // Siirretään virhe eteenpäin virheenkäsittelijälle (errorHandler)
    next(error)
  }
}

// Kontrollerifunktio elokuvien hakuun hakutermin perusteella
const searchMovies = async (req, res, next) => {
  try {
    const queryTerm = req.query.q // Otetaan hakutermi URL-parametrista

    // Tarkistetaan, että hakutermi on annettu
    if (!queryTerm) {
      return res.status(400).json({ error: 'Hakutermi (q) puuttuu' })
    }

    const movies = await fetchSearchMovies(queryTerm)
    res.status(200).json(movies)
  } catch (error) {
    // Siirretään virhe eteenpäin virheenkäsittelijälle
    next(error)
  }
}

// Hae yksittäisen elokuvan tiedot ID:n perusteella
const getMovieDetails = async (req, res, next) => {
  try {
    const movieId = req.params.id // Ottaa elokuvan ID:n URL-osoitteesta
    const { movie, videos } = await fetchMovieDetails(movieId)

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
      ...movie,
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

export { getPopularMovies, searchMovies, getMovieDetails }
