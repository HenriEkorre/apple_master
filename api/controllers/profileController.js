import { pool } from '../models/db.js'

export const getProfile = async (req, res, next) => {
  try {
    const userId = req.params.id
    if (!userId || isNaN(userId)) {
      return res.status(200).json([])
    }

    const user = await pool.query(
      `SELECT id, username, created_at FROM users WHERE id = $1`,
      [userId],
    )

    const groups = await pool.query(
      `SELECT g.* FROM groups g
       JOIN group_members gm ON g.id = gm.group_id
       WHERE gm.user_id = $1 AND gm.status = 'active'`,
      [userId],
    )

    const groupsWithLinks = (groups.rows || []).map((group) => ({
      ...group,
      name: group.name,
      link: `/groups/${group.id}`,
      type: group.type,
    }))

    const result = {
      user: user.rows,
      groups: groupsWithLinks,
    }

    res.status(200).json(result)
  } catch (error) {
    next(error)
  }
}
