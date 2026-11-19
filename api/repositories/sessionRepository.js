import { pool } from '../models/db.js'

export const findSessionUserById = async (userId) => {
  const result = await pool.query(
    'SELECT id, username, email FROM users WHERE id = $1',
    [userId],
  )
  return result.rows[0] || null
}
