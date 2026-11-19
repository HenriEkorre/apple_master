import { pool } from '../models/db.js'

export const findProfileUserById = async (userId) => {
  const result = await pool.query(
    'SELECT id, username, created_at FROM users WHERE id = $1',
    [userId],
  )
  return result.rows
}

export const findActiveGroupsByUserId = async (userId) => {
  const result = await pool.query(
    `SELECT g.* FROM groups g
     JOIN group_members gm ON g.id = gm.group_id
     WHERE gm.user_id = $1 AND gm.status = 'active'`,
    [userId],
  )
  return result.rows || []
}
