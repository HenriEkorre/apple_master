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

export const inviteUserToClosedGroup = async (req, res, next) => {
  try {
    const rawGroupId = req.params.groupId
    const rawUserId = req.body.userId

    const groupId = Number(rawGroupId)
    const invitedUserId = Number(rawUserId)
    const currentUserId = Number(req.user.id)

    // Validoi ryhmän tunnus ennen tietokantakyselyitä
    if (
      rawGroupId === undefined ||
      rawGroupId === null ||
      rawGroupId === '' ||
      !Number.isInteger(groupId) ||
      groupId <= 0
    ) {
      return res.status(400).json({
        message: 'Virheellinen ryhmän tunnus'
      })
    }

    // Validoi kutsuttavan käyttäjän tunnus ennen tietokantakyselyitä
    if (
      rawUserId === undefined ||
      rawUserId === null ||
      rawUserId === '' ||
      !Number.isInteger(invitedUserId) ||
      invitedUserId <= 0
    ) {
      return res.status(400).json({
        message: 'Virheellinen käyttäjän tunnus'
      })
    }

    // Ylläpitäjä ei voi kutsua itseään
    if (invitedUserId === currentUserId) {
      return res.status(400).json({
        message: 'Et voi kutsua itseäsi ryhmään'
      })
    }

    // 1. Tarkista, että ryhmä on olemassa
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

    // Kutsuja voi lähettää vain suljettuun ryhmään
    if (group.type !== 'closed') {
      return res.status(400).json({
        message: 'Kutsuja voi lähettää vain suljettuun ryhmään'
      })
    }

    // 2. Tarkista, että kirjautunut käyttäjä on juuri tämän ryhmän
    // aktiivinen ylläpitäjä
    const adminResult = await pool.query(
      `SELECT id
       FROM group_members
       WHERE group_id = $1
         AND user_id = $2
         AND role = 'admin'
         AND status = 'active'`,
      [groupId, currentUserId]
    )

    if (adminResult.rows.length === 0) {
      return res.status(403).json({
        message: 'Vain ryhmän ylläpitäjä voi lähettää kutsuja'
      })
    }

    // 3. Tarkista, että kutsuttava käyttäjä on olemassa
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

    // 4. Tarkista kutsuttavan nykyinen jäsenyys tai kutsu
    const membershipResult = await pool.query(
      `SELECT id, role, status
       FROM group_members
       WHERE group_id = $1
         AND user_id = $2`,
      [groupId, invitedUserId]
    )

    if (membershipResult.rows.length > 0) {
      const membership = membershipResult.rows[0]

      if (membership.status === 'active') {
        return res.status(409).json({
          message: 'Käyttäjä on jo ryhmän jäsen'
        })
      }

      if (membership.status === 'pending') {
        return res.status(409).json({
          message: 'Käyttäjällä on jo odottava kutsu tai jäsenyyspyyntö'
        })
      }
    }

    // 5. Luo uusi pending-kutsu member-roolilla
    const invitationResult = await pool.query(
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

    return res.status(201).json({
      message: 'Ryhmäkutsu lähetettiin onnistuneesti',
      invitation: invitationResult.rows[0]
    })
  } catch (error) {
    return next(error)
  }
}