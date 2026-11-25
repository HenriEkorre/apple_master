import axios from 'axios'
import { pool } from '../models/db.js'

const MAX_INT = 2147483647
const MAX_COMMENT_LENGTH = 280
const MAX_REVIEWS_RETURNED = 50

// Palauttaa positiivisen kokonaisluvun tai null, jos arvo ei kelpaa
const parseId = (value) => {
  const number = Number(value)
  return Number.isInteger(number) && number > 0 && number <= MAX_INT ? number : null
}

// Tarkistaa TMDB:stä, että elokuva on olemassa (true/false). Muut virheet heitetään eteenpäin.
const movieExists = async (tmdbId) => {
  try {
    await axios.get(`https://api.themoviedb.org/3/movie/${tmdbId}`, {
      params: { api_key: process.env.TMDB_API_KEY },
      timeout: 8000,
    })
    return true
  } catch (error) {
    if (error.response?.status === 404) return false
    throw error
  }
}

// Hae elokuvan arvostelut, yhteenveto ja kirjautuneen käyttäjän oma arvostelu
export const getMovieReviews = async (req, res, next) => {
  try {
    const tmdbId = parseId(req.params.tmdbId)
    const userId = req.user?.id ?? null

    if (!tmdbId) {
      return res.status(400).json({ message: 'Virheellinen elokuvan tunnus' })
    }

    // Yhteenveto: vain julkiset arvostelut
    const summaryResult = await pool.query(
      `SELECT COUNT(*)::int AS review_count,
              ROUND(AVG(rating), 1)::float8 AS average_rating
       FROM reviews
       WHERE tmdb_movie_id = $1 AND visibility = 'public'`,
      [tmdbId]
    )

    // Muiden arvostelut (oma arvostelu haetaan erikseen). Sähköpostia ei palauteta.
    const reviewsResult = await pool.query(
      `SELECT r.id, r.rating, r.comment, r.created_at,
              u.id AS user_id, u.username
       FROM reviews r
       JOIN users u ON u.id = r.user_id
       WHERE r.tmdb_movie_id = $1
         AND r.visibility = 'public'
         AND ($2::int IS NULL OR r.user_id <> $2::int)
       ORDER BY r.created_at DESC, r.id DESC
       LIMIT $3`,
      [tmdbId, userId, MAX_REVIEWS_RETURNED]
    )

    // Oma arvostelu
    let myReview = null
    if (userId) {
      const myResult = await pool.query(
        `SELECT id, rating, comment, created_at
         FROM reviews
         WHERE tmdb_movie_id = $1 AND user_id = $2`,
        [tmdbId, userId]
      )
      if (myResult.rows[0]) {
        myReview = {
          ...myResult.rows[0],
          user_id: userId,
          username: req.user.username,
        }
      }
    }

    res.status(200).json({
      summary: summaryResult.rows[0],
      my_review: myReview,
      reviews: reviewsResult.rows,
    })
  } catch (error) {
    next(error)
  }
}

// Luo tai päivitä oma arvostelu (tähdet + kommentti samalla rivillä)
export const saveMyReview = async (req, res, next) => {
  try {
    const userId = req.user.id
    const tmdbId = parseId(req.params.tmdbId)

    if (!tmdbId) {
      return res.status(400).json({ message: 'Virheellinen elokuvan tunnus' })
    }

    const { rating } = req.body

    // Tähtiarvio: kokonaisluku 1–5
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return res.status(400).json({
        message: 'Tähtiarvion pitää olla kokonaisluku 1–5'
      })
    }

    // Kommentti on valinnainen, mutta enintään MAX_COMMENT_LENGTH merkkiä
    let comment = null
    if (req.body.comment !== undefined && req.body.comment !== null) {
      if (typeof req.body.comment !== 'string') {
        return res.status(400).json({ message: 'Kommentin pitää olla tekstiä' })
      }

      const trimmedComment = req.body.comment.trim()

      if (trimmedComment.length > MAX_COMMENT_LENGTH) {
        return res.status(400).json({
          message: `Kommentti voi olla enintään ${MAX_COMMENT_LENGTH} merkkiä`
        })
      }

      // Tyhjä kommentti tallennetaan NULL-arvona
      comment = trimmedComment || null
    }

    // Uudelle arvostelulle varmistetaan, että elokuva on olemassa
    const existing = await pool.query(
      'SELECT 1 FROM reviews WHERE user_id = $1 AND tmdb_movie_id = $2',
      [userId, tmdbId]
    )
    if (existing.rows.length === 0 && !(await movieExists(tmdbId))) {
      return res.status(404).json({ message: 'Elokuvaa ei löytynyt' })
    }

    // uk_user_movie_review: sama kutsu luo uuden tai päivittää vanhan arvostelun.
    // Näkyvyyttä (visibility) ei ylikirjoiteta päivityksessä.
    const result = await pool.query(
      `INSERT INTO reviews (user_id, tmdb_movie_id, rating, comment, visibility)
       VALUES ($1, $2, $3, $4, 'public')
       ON CONFLICT (user_id, tmdb_movie_id)
       DO UPDATE SET rating = EXCLUDED.rating, comment = EXCLUDED.comment
       RETURNING id, rating, comment, created_at, (xmax = 0) AS inserted`,
      [userId, tmdbId, rating, comment]
    )

    const { inserted, ...review } = result.rows[0]

    res.status(inserted ? 201 : 200).json({
      review: { ...review, user_id: userId, username: req.user.username }
    })
  } catch (error) {
    next(error)
  }
}

// Poista oma arvostelu
export const deleteMyReview = async (req, res, next) => {
  try {
    const userId = req.user.id
    const tmdbId = parseId(req.params.tmdbId)

    if (!tmdbId) {
      return res.status(400).json({ message: 'Virheellinen elokuvan tunnus' })
    }

    // Poistetaan vain kirjautuneen käyttäjän oma rivi
    const result = await pool.query(
      `DELETE FROM reviews
       WHERE user_id = $1 AND tmdb_movie_id = $2
       RETURNING id`,
      [userId, tmdbId]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Arvostelua ei löytynyt' })
    }

    res.status(200).json({ message: 'Arvostelu poistettiin' })
  } catch (error) {
    next(error)
  }
}