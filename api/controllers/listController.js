import { pool } from '../models/db.js'

// Hae kirjautuneen käyttäjän omat listat
export const getMyLists = async (req, res, next) => {
  try {
    const userId = req.user.id // Saadaan middlewarelta suoraan

    // Haetaan tietokannasta listat, joiden omistaja on tämä käyttäjä
    const result = await pool.query(
      `SELECT * FROM lists WHERE owner_type = 'user' AND owner_id = $1`,
      [userId]
    )

    res.status(200).json(result.rows)
  } catch (error) {
    next(error)
  }
}