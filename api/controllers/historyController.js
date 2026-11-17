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