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

// Julkiseen ryhmään liittyminen
export const joinPublicGroup = async (req, res, next) => {
  try {
    const userId = req.user.id
    const groupId = Number(req.params.groupId)

    // Tarkistetaan ryhmän tunnus
    if (!Number.isInteger(groupId) || groupId <= 0) {
      return res.status(400).json({
        message: 'Virheellinen ryhmän tunnus'
      })
    }

    // Haetaan ryhmä ja tarkistetaan, että se on julkinen
    const groupResult = await pool.query(
      `SELECT id, type
       FROM groups
       WHERE id = $1`,
      [groupId]
    )

    if (groupResult.rows.length === 0) {
      return res.status(404).json({
        message: 'Ryhmää ei löytynyt'
      })
    }

    const group = groupResult.rows[0]

    if (group.type !== 'public') {
      return res.status(403).json({
        message: 'Suljettuun ryhmään ei voi liittyä suoraan'
      })
    }

    // Lisätään käyttäjä suoraan aktiiviseksi jäseneksi
    const result = await pool.query(
      `INSERT INTO group_members (
         group_id,
         user_id,
         role,
         status
       )
       VALUES ($1, $2, 'member', 'active')
       ON CONFLICT (group_id, user_id)
       DO UPDATE SET status = 'active'
       RETURNING id, group_id, user_id, role, status`,
      [groupId, userId]
    )

    res.status(200).json({
      message: 'Ryhmään liittyminen onnistui',
      membership: result.rows[0]
    })
  } catch (error) {
    next(error)
  }
}