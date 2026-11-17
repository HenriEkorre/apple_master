import { pool } from '../models/db.js'

// Hae kirjautuneen käyttäjän omat kommentit
export const getMyComments = async (req, res, next) => {
  try {
    const userId = req.user.id

    const result = await pool.query(
      `SELECT * FROM comments 
       WHERE user_id = $1 
       ORDER BY created_at DESC`,
      [userId]
    )

    res.status(200).json(result.rows)
  } catch (error) {
    next(error)
  }
}

// Lisää uusi kommentti
export const createComment = async (req, res, next) => {
  try {
    const userId = req.user.id
    // Käytetään suoraan movieId-kenttää comments-taulussa
    const movieId = req.body.movieId || req.body.tmdb_movie_id
    const { content } = req.body

    if (!movieId || !content) {
      return res.status(400).json({ error: "Movie ID and content are required" })
    }

    const result = await pool.query(
      `INSERT INTO comments (user_id, movie_id, content) 
       VALUES ($1, $2, $3) 
       RETURNING *`,
      [userId, movieId, content]
    )

    res.status(201).json(result.rows[0])
  } catch (error) {
    next(error)
  }
}