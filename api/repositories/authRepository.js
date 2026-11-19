import { pool } from '../models/db.js'

export const findUserByCredentials = async (username, email) => {
  const result = await pool.query(
    'SELECT id FROM users WHERE username = $1 OR email = $2',
    [username, email],
  )
  return result.rows
}

export const createUser = async (username, email, passwordHash) => {
  return pool.query(
    `INSERT INTO users (username, email, password_hash)
     VALUES ($1, $2, $3) RETURNING id, username, created_at`,
    [username, email, passwordHash],
  )
}

export const findUserByEmail = async (email) => {
  const result = await pool.query(
    'SELECT * FROM users WHERE email = $1',
    [email],
  )
  return result.rows[0] || null
}
