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

    // Haetaan ryhmä
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

// Lähetä käyttäjälle kutsu suljettuun ryhmään
export const inviteUserToClosedGroup = async (req, res, next) => {
  try {
    const adminId = req.user.id
    const groupId = Number(req.params.groupId)
    const invitedUserId = Number(req.body.userId)

    // Tarkistetaan ryhmän tunnus
    if (!Number.isInteger(groupId) || groupId <= 0) {
      return res.status(400).json({
        message: 'Virheellinen ryhmän tunnus'
      })
    }

    // Tarkistetaan kutsuttavan käyttäjän tunnus
    if (!Number.isInteger(invitedUserId) || invitedUserId <= 0) {
      return res.status(400).json({
        message: 'Virheellinen käyttäjän tunnus'
      })
    }

    // Käyttäjä ei voi kutsua itseään
    if (adminId === invitedUserId) {
      return res.status(400).json({
        message: 'Et voi kutsua itseäsi ryhmään'
      })
    }

    // Haetaan ryhmä
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

    // Kutsuja voi lähettää vain suljettuun ryhmään (closed)
    if (group.type !== 'closed') {
      return res.status(400).json({
        message: 'Kutsuja voi lähettää vain suljettuun ryhmään'
      })
    }

    // Tarkistetaan, että kutsun lähettäjä on ryhmän aktiivinen ylläpitäjä
    const adminResult = await pool.query(
      `SELECT id
       FROM group_members
       WHERE group_id = $1
         AND user_id = $2
         AND role = 'admin'
         AND status = 'active'`,
      [groupId, adminId]
    )

    if (adminResult.rows.length === 0) {
      return res.status(403).json({
        message: 'Vain ryhmän ylläpitäjä voi lähettää kutsuja'
      })
    }

    // Tarkistetaan, että kutsuttava käyttäjä on olemassa
    const userResult = await pool.query(
      `SELECT id
       FROM users
       WHERE id = $1`,
      [invitedUserId]
    )

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        message: 'Kutsuttavaa käyttäjää ei löytynyt'
      })
    }

    // Tarkistetaan mahdollinen olemassa oleva jäsenyys tai kutsu
    const existingMembershipResult = await pool.query(
      `SELECT id, role, status
       FROM group_members
       WHERE group_id = $1
         AND user_id = $2`,
      [groupId, invitedUserId]
    )

    if (existingMembershipResult.rows.length > 0) {
      const existingMembership = existingMembershipResult.rows[0]

      if (existingMembership.status === 'active') {
        return res.status(409).json({
          message: 'Käyttäjä on jo ryhmän jäsen'
        })
      }

      return res.status(409).json({
        message: 'Käyttäjällä on jo odottava kutsu tai jäsenyyspyyntö'
      })
    }

    // Luodaan odottava kutsu (status = 'pending')
    const result = await pool.query(
      `INSERT INTO group_members (
         group_id,
         user_id,
         role,
         status
       )
       VALUES ($1, $2, 'member', 'pending')
       RETURNING id, group_id, user_id, role, status`,
      [groupId, invitedUserId]
    )

    res.status(201).json({
      message: 'Ryhmäkutsu lähetettiin onnistuneesti',
      invitation: result.rows[0]
    })
  } catch (error) {
    next(error)
  }
}