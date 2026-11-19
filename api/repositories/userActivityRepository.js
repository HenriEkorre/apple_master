import { pool } from '../models/db.js'

export const findReviewsByUserId = async (userId) => {
  const result = await pool.query(
    `SELECT * FROM reviews
     WHERE user_id = $1
     ORDER BY created_at DESC`,
    [userId],
  )
  return result.rows
}

export const createReview = async (userId, movieId, rating, comment) => {
  const result = await pool.query(
    `INSERT INTO reviews (user_id, tmdb_movie_id, rating, comment)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [userId, movieId, rating, comment],
  )
  return result.rows[0]
}

export const findCommentsByUserId = async (userId) => {
  const result = await pool.query(
    `SELECT * FROM comments
     WHERE user_id = $1
     ORDER BY created_at DESC`,
    [userId],
  )
  return result.rows
}

export const createComment = async (userId, movieId, content) => {
  const result = await pool.query(
    `INSERT INTO comments (user_id, movie_id, content)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [userId, movieId, content],
  )
  return result.rows[0]
}

export const findHistoryByUserId = async (userId) => {
  const result = await pool.query(
    `SELECT * FROM watch_history
     WHERE user_id = $1
     ORDER BY watched_at DESC`,
    [userId],
  )
  return result.rows
}

export const createHistoryEntry = async (userId, movieId) => {
  const result = await pool.query(
    `INSERT INTO watch_history (user_id, movie_id)
     VALUES ($1, $2)
     RETURNING *`,
    [userId, movieId],
  )
  return result.rows[0]
}
