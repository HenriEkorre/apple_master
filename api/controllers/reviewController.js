import {
  createReview as insertReview,
  findReviewsByUserId,
} from '../repositories/userActivityRepository.js'

// Hae kirjautuneen käyttäjän omat arvostelut
export const getMyReviews = async (req, res, next) => {
  try {
    const userId = req.user.id

    const reviews = await findReviewsByUserId(userId)
    res.status(200).json(reviews)
  } catch (error) {
    next(error)
  }
}

// Luo uusi arvostelu
export const createReview = async (req, res, next) => {
  try {
    const userId = req.user.id
    // Otetaan vastaan joko movieId tai tmdb_movie_id, ja tallennetaan tietokannan vaatimaan kenttään
    const movieId = req.body.movieId || req.body.tmdb_movie_id
    const { rating, comment } = req.body

    if (!movieId || !rating) {
      return res.status(400).json({ error: 'Movie ID and rating are required' })
    }

    const review = await insertReview(userId, movieId, rating, comment)
    res.status(201).json(review)
  } catch (error) {
    next(error)
  }
}