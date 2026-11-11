import { pool } from '../models/db.js'

// Hae kirjautuneen käyttäjän ryhmät
export const getMyGroups = async (req, res, next) => {
  try {
    // Otetaan id turvallisesti, tarkistetaan onko se numero
    const rawId = req.user?.id || req.user?.sub
    const userId = Number(rawId)

    if (!userId || isNaN(userId)) {
      // Jos id ei ole validi numero, palautetaan tyhjä lista tai 401 kaatumisen sijaan
      return res.status(200).json([])
    }

    // Vain aktiiviset jäsenyydet (ei odottavia kutsuja)
    const result = await pool.query(
      `SELECT g.* FROM groups g
       JOIN group_members gm ON g.id = gm.group_id
       WHERE gm.user_id = $1 AND gm.status = 'active'`,
      [userId]
    )

    return res.status(200).json(result.rows || [])
  } catch (error) {
    console.error("VIRHE getMyGroups-funktiossa:", error.message)
    next(error)
  }
}

// Hae kirjautuneen käyttäjän saamat kutsut (suljettuihin ryhmiin)
export const getMyInvitations = async (req, res, next) => {
  try {
    const userId = req.user.id

    const result = await pool.query(
      `SELECT g.id, g.name, g.description, g.type
       FROM groups g
       JOIN group_members gm ON g.id = gm.group_id
       WHERE gm.user_id = $1 AND gm.status = 'pending'
       ORDER BY g.name`,
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
        message: 'Suljettuun ryhmään pääsee vain kutsulla'
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
// Kutsuttava voidaan antaa joko käyttäjänimellä (username) tai tunnuksella (userId)
export const inviteUserToClosedGroup = async (req, res, next) => {
  try {
    const adminId = req.user.id
    const groupId = Number(req.params.groupId)
    const rawUsername = typeof req.body.username === 'string' ? req.body.username.trim() : ''

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

    // Selvitetään kutsuttava käyttäjä: käyttäjänimellä tai tunnuksella
    let invitedUserId

    if (rawUsername) {
      const userByName = await pool.query(
        `SELECT id
         FROM users
         WHERE LOWER(username) = LOWER($1)`,
        [rawUsername]
      )

      if (userByName.rows.length === 0) {
        return res.status(404).json({
          message: 'Kutsuttavaa käyttäjää ei löytynyt'
        })
      }

      invitedUserId = userByName.rows[0].id
    } else {
      invitedUserId = Number(req.body.userId)

      // Tarkistetaan kutsuttavan käyttäjän tunnus
      if (!Number.isInteger(invitedUserId) || invitedUserId <= 0) {
        return res.status(400).json({
          message: 'Anna kutsuttavan käyttäjänimi'
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
    }

    // Käyttäjä ei voi kutsua itseään
    if (adminId === invitedUserId) {
      return res.status(400).json({
        message: 'Et voi kutsua itseäsi ryhmään'
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
        message: 'Käyttäjälle on jo lähetetty kutsu'
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

// Käyttäjä hyväksyy saamansa kutsun (pending -> active)
// Kutsun hylkääminen tehdään leaveGroup-funktiolla (poistaa rivin)
export const acceptInvitation = async (req, res, next) => {
  try {
    const userId = req.user.id
    const groupId = Number(req.params.groupId)

    if (!Number.isInteger(groupId) || groupId <= 0) {
      return res.status(400).json({
        message: 'Virheellinen ryhmän tunnus'
      })
    }

    const result = await pool.query(
      `UPDATE group_members
       SET status = 'active'
       WHERE group_id = $1
         AND user_id = $2
         AND status = 'pending'
       RETURNING id, group_id, user_id, role, status`,
      [groupId, userId]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: 'Kutsua ei löytynyt'
      })
    }

    res.status(200).json({
      message: 'Kutsu hyväksyttiin',
      membership: result.rows[0]
    })
  } catch (error) {
    next(error)
  }
}

// Luo uusi ryhmä
export const createGroup = async (req, res, next) => {
  try {
    const { name, description, type } = req.body
    const creatorId = req.user.id

    // Pakolliset kentät
    if (!name || !type) {
      return res.status(400).json({
        message: "Nimi ja ryhmän tyyppi ovat pakollisia"
      })
    }

    // Sallitaan vain enum-arvot
    if (!["public", "closed"].includes(type)) {
      return res.status(400).json({
        message: "Ryhmän tyyppi täytyy olla joko public tai closed"
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

// Hae yksittäisen ryhmän tiedot ja sen jäsenet
// - Suljetun ryhmän jäsenlista näytetään vain ryhmän jäsenille (muille members = null)
// - Odottavat kutsut näytetään vain ylläpitäjälle
// - Sähköposteja ei palauteta
export const getGroupById = async (req, res, next) => {
  try {
    const groupId = Number(req.params.groupId)
    const userId = req.user.id

    if (!Number.isInteger(groupId) || groupId <= 0) {
      return res.status(400).json({ message: 'Virheellinen ryhmän tunnus' })
    }

    const groupResult = await pool.query(
      `SELECT g.*,
        (SELECT COUNT(*) FROM group_members gm
         WHERE gm.group_id = g.id AND gm.status = 'active') AS member_count
       FROM groups g WHERE g.id = $1`,
      [groupId]
    )

    if (groupResult.rows.length === 0) {
      return res.status(404).json({ message: 'Ryhmää ei löytynyt' })
    }

    const group = groupResult.rows[0]

    // Käyttäjän oma jäsenyys (jos on)
    const membershipResult = await pool.query(
      `SELECT role, status
       FROM group_members
       WHERE group_id = $1 AND user_id = $2`,
      [groupId, userId]
    )

    const membership = membershipResult.rows[0]
    const myStatus = membership?.status ?? null // 'active' | 'pending' (kutsuttu) | null
    const myRole = membership?.role ?? null
    const isMember = myStatus === 'active'
    const isAdmin = isMember && myRole === 'admin'

    // Jäsenlista: julkisille kaikille, suljetuille vain jäsenille
    let members = null
    if (group.type === 'public' || isMember) {
      const membersResult = await pool.query(
        `SELECT gm.id, gm.role, gm.status, u.id AS user_id, u.username
         FROM group_members gm
         JOIN users u ON gm.user_id = u.id
         WHERE gm.group_id = $1
           AND ($2::boolean OR gm.status = 'active')`,
        [groupId, isAdmin]
      )
      members = membersResult.rows
    }

    res.status(200).json({
      ...group,
      member_count: Number(group.member_count),
      isMember,
      myStatus,
      myRole,
      members
    })
  } catch (error) {
    next(error)
  }
}

// Hae kaikki ryhmät selaamista varten
export const getAllGroups = async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT g.*, 
        (SELECT COUNT(*) FROM group_members gm WHERE gm.group_id = g.id AND gm.status = 'active') AS member_count
       FROM groups g 
       ORDER BY g.created_at DESC`
    )
    res.status(200).json(result.rows)
  } catch (error) {
    next(error)
  }
}

// Poistu ryhmästä (tai hylkää kutsu)
export const leaveGroup = async (req, res, next) => {
  const client = await pool.connect()
  try {
    const userId = req.user.id
    const groupId = Number(req.params.groupId)

    if (!Number.isInteger(groupId) || groupId <= 0) {
      return res.status(400).json({ message: 'Virheellinen ryhmän tunnus' })
    }

    await client.query('BEGIN')

    // Lukitaan ryhmä, jotta samanaikaiset poistumiset menevät jonoon
    const groupResult = await client.query(
      'SELECT id FROM groups WHERE id = $1 FOR UPDATE',
      [groupId]
    )
    if (groupResult.rows.length === 0) {
      await client.query('ROLLBACK')
      return res.status(404).json({ message: 'Ryhmää ei löytynyt' })
    }

    const membershipResult = await client.query(
      `SELECT role, status FROM group_members
       WHERE group_id = $1 AND user_id = $2`,
      [groupId, userId]
    )
    if (membershipResult.rows.length === 0) {
      await client.query('ROLLBACK')
      return res.status(404).json({ message: 'Et ole tämän ryhmän jäsen' })
    }

    const { role, status } = membershipResult.rows[0]

    if (status === 'active') {
      const othersResult = await client.query(
        `SELECT
           COUNT(*) AS other_members,
           COUNT(*) FILTER (WHERE role = 'admin') AS other_admins
         FROM group_members
         WHERE group_id = $1 AND user_id <> $2 AND status = 'active'`,
        [groupId, userId]
      )
      const otherMembers = Number(othersResult.rows[0].other_members)
      const otherAdmins = Number(othersResult.rows[0].other_admins)

      // Viimeinen aktiivinen jäsen: poistetaan koko ryhmä
      if (otherMembers === 0) {
        await client.query('DELETE FROM group_members WHERE group_id = $1', [groupId])
        // Jos ryhmillä on omia elokuvalistoja, poista nekin (owner_id ei ole FK):
        // await client.query(`DELETE FROM lists WHERE owner_type = 'group' AND owner_id = $1`, [groupId])
        await client.query('DELETE FROM groups WHERE id = $1', [groupId])
        await client.query('COMMIT')
        return res.status(200).json({
          message: 'Poistuit ryhmästä ja ryhmä poistettiin, koska siihen ei jäänyt jäseniä',
          groupDeleted: true,
        })
      }

      // Viimeinen ylläpitäjä ei voi poistua, kun muita jäseniä on
      if (role === 'admin' && otherAdmins === 0) {
        await client.query('ROLLBACK')
        return res.status(400).json({
          message: 'Nimeä ensin toinen ylläpitäjä ennen poistumista',
        })
      }
    }

    // Tavallinen poistuminen (tai kutsun hylkääminen, jos status = pending)
    await client.query(
      'DELETE FROM group_members WHERE group_id = $1 AND user_id = $2',
      [groupId, userId]
    )

    await client.query('COMMIT')
    res.status(200).json({ message: 'Poistuit ryhmästä', groupDeleted: false })
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {})
    next(error)
  } finally {
    client.release()
  }
}

// Ylläpitäjä poistaa jäsenen tai peruu lähettämänsä kutsun
export const removeMember = async (req, res, next) => {
  try {
    const adminId = req.user.id
    const groupId = Number(req.params.groupId)
    const targetUserId = Number(req.params.userId)

    if (!Number.isInteger(groupId) || groupId <= 0 ||
        !Number.isInteger(targetUserId) || targetUserId <= 0) {
      return res.status(400).json({ message: 'Virheellinen tunnus' })
    }

    if (adminId === targetUserId) {
      return res.status(400).json({ message: 'Käytä poistumistoimintoa omaan jäsenyyteesi' })
    }

    // Pyytäjän pitää olla ryhmän aktiivinen ylläpitäjä
    const adminResult = await pool.query(
      `SELECT 1 FROM group_members
       WHERE group_id = $1 AND user_id = $2 AND role = 'admin' AND status = 'active'`,
      [groupId, adminId]
    )
    if (adminResult.rows.length === 0) {
      return res.status(403).json({ message: 'Vain ylläpitäjä voi poistaa jäseniä' })
    }

    const targetResult = await pool.query(
      'SELECT role FROM group_members WHERE group_id = $1 AND user_id = $2',
      [groupId, targetUserId]
    )
    if (targetResult.rows.length === 0) {
      return res.status(404).json({ message: 'Käyttäjä ei ole ryhmän jäsen' })
    }

    // Ylläpitäjää ei voi poistaa suoraan, rooli pitää ensin poistaa
    if (targetResult.rows[0].role === 'admin') {
      return res.status(403).json({ message: 'Ylläpitäjää ei voi poistaa. Poista ensin hänen ylläpitäjän roolinsa.' })
    }

    await pool.query(
      'DELETE FROM group_members WHERE group_id = $1 AND user_id = $2',
      [groupId, targetUserId]
    )

    res.status(200).json({ message: 'Jäsen poistettiin ryhmästä' })
  } catch (error) {
    next(error)
  }
}

export const updateMemberRole = async (req, res, next) => {
  try {
    const adminId = req.user.id
    const groupId = Number(req.params.groupId)
    const targetUserId = Number(req.params.userId)
    const { role } = req.body

    if (!Number.isInteger(groupId) || groupId <= 0 ||
        !Number.isInteger(targetUserId) || targetUserId <= 0) {
      return res.status(400).json({ message: 'Virheellinen tunnus' })
    }
    if (!['admin', 'member'].includes(role)) {
      return res.status(400).json({ message: 'Rooli täytyy olla admin tai member' })
    }
    if (adminId === targetUserId) {
      return res.status(400).json({ message: 'Et voi muuttaa omaa rooliasi' })
    }

    const adminResult = await pool.query(
      `SELECT 1 FROM group_members
       WHERE group_id = $1 AND user_id = $2 AND role = 'admin' AND status = 'active'`,
      [groupId, adminId]
    )
    if (adminResult.rows.length === 0) {
      return res.status(403).json({ message: 'Vain ylläpitäjä voi muuttaa rooleja' })
    }

    // Vain aktiivisen jäsenen roolia voi muuttaa (ei odottavan kutsun)
    const result = await pool.query(
      `UPDATE group_members SET role = $1
       WHERE group_id = $2 AND user_id = $3 AND status = 'active'
       RETURNING user_id, role`,
      [role, groupId, targetUserId]
    )
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Aktiivista jäsentä ei löytynyt' })
    }

    res.status(200).json(result.rows[0])
  } catch (error) {
    next(error)
  }
}