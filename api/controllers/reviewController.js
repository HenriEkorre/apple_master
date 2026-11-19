import { pool } from '../models/db.js'

// Hae kirjautuneen käyttäjän omat arvostelut
export const getMyReviews = async (req, res, next) => {
  try {
    const userId = req.user.id

    const result = await pool.query(
      `SELECT * FROM reviews 
       WHERE user_id = $1 
       ORDER BY created_at DESC`,
      [userId]
    )

    res.status(200).json(result.rows)
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

    const result = await pool.query(
      `INSERT INTO reviews (user_id, tmdb_movie_id, rating, comment) 
       VALUES ($1, $2, $3, $4) 
       RETURNING *`,
      [userId, movieId, rating, comment]
    )

    res.status(201).json(result.rows[0])
  } catch (error) {
    next(error)
  }
}