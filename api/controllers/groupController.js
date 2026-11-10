import { pool } from '../models/db.js'

// Hae kirjautuneen käyttäjän ryhmät
export const getMyGroups = async (req, res, next) => {
  try {
    const userId = req.user.id

    // Liitetään groups- ja group_members-taulut yhteen
    const result = await pool.query(
      `SELECT g.* FROM groups g
       JOIN group_members gm ON g.id = gm.group_id
       WHERE gm.user_id = $1`,
      [userId]
    )

    res.status(200).json(result.rows)
  } catch (error) {
    next(error)
  }
}