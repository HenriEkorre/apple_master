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