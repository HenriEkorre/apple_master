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

export const createGroup = async (req, res, next) => {
  try {
    const { name, description, type } = req.body
    const creatorId = req.user.id

    // Pakolliset kentät
    if (!name || !type) {
      return res.status(400).json({
        message: "Name and type are required"
      })
    }

    // Sallitaan vain enum-arvot
    if (!["public", "closed"].includes(type)) {
      return res.status(400).json({
        message: "Type must be public or closed"
      })
    }

    const groupResult = await pool.query(
      `INSERT INTO groups
       (name, description, type, creator_id)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [name, description, type, creatorId]
    )

    const group = groupResult.rows[0]

    await pool.query(
      `INSERT INTO group_members
       (group_id, user_id, role, status)
       VALUES ($1, $2, 'admin', 'active')`,
      [group.id, creatorId]
    )

    res.status(201).json(group)
  } catch (error) {
    next(error)
  }
}