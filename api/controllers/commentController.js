import { pool } from '../models/db.js'

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