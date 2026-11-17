import { pool } from '../models/db.js'

// Hae kirjautuneen käyttäjän katseluhistoria aikajärjestyksessä
export const getMyHistory = async (req, res, next) => {
  try {
    const userId = req.user.id

    const result = await pool.query(
      `SELECT * FROM watch_history 
       WHERE user_id = $1 
       ORDER BY watched_at DESC`,
      [userId]
    )

    res.status(200).json(result.rows)
  } catch (error) {
    next(error)
  }
}

// Lisää elokuva katseluhistoriaan
export const addToHistory = async (req, res, next) => {
  try {
    const userId = req.user.id
    const { movieId } = req.body

    if (!movieId) {
      return res.status(400).json({ error: "Movie ID is required" })
    }

    const result = await pool.query(
      `INSERT INTO watch_history (user_id, movie_id) 
       VALUES ($1, $2) 
       RETURNING *`,
      [userId, movieId]
    )

    res.status(201).json(result.rows[0])
  } catch (error) {
    next(error)
  }
}