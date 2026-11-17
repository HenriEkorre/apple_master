import axios from 'axios'
import { pool } from '../models/db.js'

const MAX_INT = 2147483647
const MAX_TITLE_LENGTH = 255 // lists.title on VARCHAR(255)
const MAX_MOVIES_PER_LIST = 50 // elokuvien tiedot haetaan TMDB:stä listaa avattaessa

// Palauttaa positiivisen kokonaisluvun tai null, jos arvo ei kelpaa
const parseId = (value) => {
  const number = Number(value)
  return Number.isInteger(number) && number > 0 && number <= MAX_INT ? number : null
}

// Hae yksi elokuva TMDB:stä ja palauta vain tarvittavat kentät
const fetchMovieSummary = async (tmdbMovieId) => {
  const response = await axios.get(
    `https://api.themoviedb.org/3/movie/${tmdbMovieId}`,
    {
      params: { api_key: process.env.TMDB_API_KEY, language: 'fi-FI' },
      timeout: 8000,
    }
  )
  const movie = response.data
  return {
    id: movie.id,
    title: movie.title,
    poster_path: movie.poster_path,
    release_date: movie.release_date,
    vote_average: movie.vote_average,
  }
}

// Hae monta elokuvaa rinnakkain. Jos yksi epäonnistuu, listalle jää paikkamerkki.
const fetchMovieSummaries = async (ids) => {
  const results = await Promise.allSettled(ids.map(fetchMovieSummary))
  return results.map((result, index) =>
    result.status === 'fulfilled'
      ? result.value
      : { id: ids[index], title: null, unavailable: true }
  )
}

// Hae lista vain, jos se kuuluu tälle käyttäjälle
const findOwnedList = async (listId, userId) => {
  const result = await pool.query(
    `SELECT * FROM lists
     WHERE id = $1 AND owner_type = 'user' AND owner_id = $2`,
    [listId, userId]
  )
  return result.rows[0] || null
}

// Hae kirjautuneen käyttäjän omat listat
export const getMyLists = async (req, res, next) => {
  try {
    const userId = req.user.id // Saadaan middlewarelta suoraan

    let movieId = null
    if (req.query.movieId !== undefined) {
      movieId = parseId(req.query.movieId)
      if (!movieId) {
        return res.status(400).json({ message: 'Virheellinen elokuvan tunnus' })
      }
    }

    // movie_count kertoo listalla olevien elokuvien määrän
    const result = await pool.query(
      `SELECT l.*,
        (SELECT COUNT(*) FROM list_movies lm WHERE lm.list_id = l.id)::int AS movie_count,
        CASE
          WHEN $2::int IS NULL THEN false
          ELSE EXISTS (
            SELECT 1 FROM list_movies lm2
            WHERE lm2.list_id = l.id AND lm2.tmdb_movie_id = $2::int
          )
        END AS contains_movie
       FROM lists l
       WHERE l.owner_type = 'user' AND l.owner_id = $1
       ORDER BY l.created_at ASC, l.id ASC`,
      [userId, movieId]
    )

    res.status(200).json(result.rows)
  } catch (error) {
    next(error)
  }
}

// Luo uusi toivelista kirjautuneelle käyttäjälle
export const createList = async (req, res, next) => {
  try {
    const userId = req.user.id
    const { title } = req.body

    // Nimen pitää olla merkkijono
    if (typeof title !== 'string') {
      return res.status(400).json({ message: 'Listan nimi on pakollinen' })
    }

    // Tyhjää nimeä ei hyväksytä (myöskään pelkkiä välilyöntejä)
    const trimmedTitle = title.trim()

    if (!trimmedTitle) {
      return res.status(400).json({ message: 'Listan nimi ei voi olla tyhjä' })
    }

    if (trimmedTitle.length > MAX_TITLE_LENGTH) {
      return res.status(400).json({
        message: `Listan nimi voi olla enintään ${MAX_TITLE_LENGTH} merkkiä`,
      })
    }

    const result = await pool.query(
      `INSERT INTO lists (title, owner_type, owner_id)
       VALUES ($1, 'user', $2)
       RETURNING *`,
      [trimmedTitle, userId]
    )

    res.status(201).json({ ...result.rows[0], movie_count: 0 })
  } catch (error) {
    next(error)
  }
}

// Hae yksittäinen lista elokuvineen
export const getListById = async (req, res, next) => {
  try {
    const userId = req.user.id
    const listId = parseId(req.params.id)

    if (!listId) {
      return res.status(400).json({ message: 'Virheellinen listan tunnus' })
    }

    const list = await findOwnedList(listId, userId)
    if (!list) {
      return res.status(404).json({ message: 'Listaa ei löytynyt' })
    }

    // Uusimmat elokuvat ensin
    const moviesResult = await pool.query(
      `SELECT tmdb_movie_id FROM list_movies
       WHERE list_id = $1
       ORDER BY added_at DESC, id DESC`,
      [listId]
    )

    const movies = await fetchMovieSummaries(
      moviesResult.rows.map((row) => row.tmdb_movie_id)
    )

    res.status(200).json({ ...list, movies })
  } catch (error) {
    next(error)
  }
}

// Lisää elokuva listalle
export const addMovieToList = async (req, res, next) => {
  try {
    const userId = req.user.id
    const listId = parseId(req.params.id)
    const tmdbMovieId = parseId(req.body.tmdbMovieId)

    if (!listId) {
      return res.status(400).json({ message: 'Virheellinen listan tunnus' })
    }
    if (!tmdbMovieId) {
      return res.status(400).json({ message: 'Virheellinen elokuvan tunnus' })
    }

    const list = await findOwnedList(listId, userId)
    if (!list) {
      return res.status(404).json({ message: 'Listaa ei löytynyt' })
    }

    // Rajoitetaan listan koko
    const countResult = await pool.query(
      'SELECT COUNT(*)::int AS count FROM list_movies WHERE list_id = $1',
      [listId]
    )
    if (countResult.rows[0].count >= MAX_MOVIES_PER_LIST) {
      return res.status(400).json({
        message: `Listalla voi olla enintään ${MAX_MOVIES_PER_LIST} elokuvaa`,
      })
    }

    // Varmistetaan TMDB:stä, että elokuva on olemassa, ja haetaan sen tiedot
    let movie
    try {
      movie = await fetchMovieSummary(tmdbMovieId)
    } catch (error) {
      if (error.response?.status === 404) {
        return res.status(404).json({ message: 'Elokuvaa ei löytynyt' })
      }
      throw error
    }

    // uk_list_movie estää saman elokuvan lisäämisen kahdesti
    const insertResult = await pool.query(
      `INSERT INTO list_movies (list_id, tmdb_movie_id, added_by)
       VALUES ($1, $2, $3)
       ON CONFLICT (list_id, tmdb_movie_id) DO NOTHING
       RETURNING id, added_at`,
      [listId, tmdbMovieId, userId]
    )

    if (insertResult.rows.length === 0) {
      return res.status(409).json({ message: 'Elokuva on jo listalla' })
    }

    res.status(201).json({ movie, added_at: insertResult.rows[0].added_at })
  } catch (error) {
    next(error)
  }
}

// Poista elokuva listalta
export const removeMovieFromList = async (req, res, next) => {
  try {
    const userId = req.user.id
    const listId = parseId(req.params.id)
    const tmdbMovieId = parseId(req.params.tmdbMovieId)

    if (!listId || !tmdbMovieId) {
      return res.status(400).json({ message: 'Virheellinen tunnus' })
    }

    // Omistajuus tarkistetaan samassa kyselyssä
    const result = await pool.query(
      `DELETE FROM list_movies lm
       USING lists l
       WHERE lm.list_id = l.id
         AND l.id = $1
         AND l.owner_type = 'user'
         AND l.owner_id = $2
         AND lm.tmdb_movie_id = $3
       RETURNING lm.id`,
      [listId, userId, tmdbMovieId]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Elokuvaa ei löytynyt listalta' })
    }

    res.status(200).json({ message: 'Elokuva poistettiin listalta' })
  } catch (error) {
    next(error)
  }
}

// Vaihda listan nimi
export const updateList = async (req, res, next) => {
  try {
    const userId = req.user.id
    const listId = parseId(req.params.id)

    if (!listId) {
      return res.status(400).json({ message: 'Virheellinen listan tunnus' })
    }

    const { title } = req.body

    if (typeof title !== 'string') {
      return res.status(400).json({ message: 'Listan nimi on pakollinen' })
    }

    // Tyhjää nimeä ei hyväksytä (myöskään pelkkiä välilyöntejä)
    const trimmedTitle = title.trim()

    if (!trimmedTitle) {
      return res.status(400).json({ message: 'Listan nimi ei voi olla tyhjä' })
    }

    if (trimmedTitle.length > MAX_TITLE_LENGTH) {
      return res.status(400).json({
        message: `Listan nimi voi olla enintään ${MAX_TITLE_LENGTH} merkkiä`,
      })
    }

    // Omistajuus tarkistetaan samassa kyselyssä
    const result = await pool.query(
      `UPDATE lists SET title = $1
       WHERE id = $2 AND owner_type = 'user' AND owner_id = $3
       RETURNING *`,
      [trimmedTitle, listId, userId]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Listaa ei löytynyt' })
    }

    res.status(200).json(result.rows[0])
  } catch (error) {
    next(error)
  }
}

// Poista koko lista (listan elokuvat poistuvat samalla: ON DELETE CASCADE)
export const deleteList = async (req, res, next) => {
  try {
    const userId = req.user.id
    const listId = parseId(req.params.id)

    if (!listId) {
      return res.status(400).json({ message: 'Virheellinen listan tunnus' })
    }

    const result = await pool.query(
      `DELETE FROM lists
       WHERE id = $1 AND owner_type = 'user' AND owner_id = $2
       RETURNING id`,
      [listId, userId]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Listaa ei löytynyt' })
    }

    res.status(200).json({ message: 'Lista poistettiin' })
  } catch (error) {
    next(error)
  }
}

// Luo uusi lista ryhmälle
export const createGroupList = async (req, res, next) => {
  try {
    const userId = req.user.id
    const groupId = parseId(req.params.groupId)
    const { title } = req.body

    if (!groupId) {
      return res.status(400).json({
        message: 'Virheellinen ryhmän tunnus'
      })
    }

    if (typeof title !== 'string') {
      return res.status(400).json({
        message: 'Listan nimi on pakollinen'
      })
    }

    const trimmedTitle = title.trim()

    if (!trimmedTitle) {
      return res.status(400).json({
        message: 'Listan nimi ei voi olla tyhjä'
      })
    }

    if (trimmedTitle.length > MAX_TITLE_LENGTH) {
      return res.status(400).json({
        message: `Listan nimi voi olla enintään ${MAX_TITLE_LENGTH} merkkiä`,
      })
    }

    const groupResult = await pool.query(
      `SELECT id
      FROM groups
      WHERE id = $1`,
      [groupId]
    )

    if (groupResult.rows.length === 0) {
      return res.status(404).json({
       message: 'Ryhmää ei löytynyt'
      })
    }

    const adminResult = await pool.query(
      `SELECT 1
       FROM group_members
       WHERE group_id = $1
         AND user_id = $2
         AND role = 'admin'
         AND status = 'active'`,
      [groupId, userId]
    )

    if (adminResult.rows.length === 0) {
      return res.status(403).json({
        message: 'Vain ryhmän ylläpitäjä voi luoda listoja'
      })
    }

    const result = await pool.query(
      `INSERT INTO lists (
        title,
        owner_type,
        owner_id
      )
      VALUES (
        $1,
        'group',
        $2
      )
      RETURNING *`,
      [trimmedTitle, groupId]
    )

    res.status(201).json({
      ...result.rows[0],
      movie_count: 0
    })
  } catch (error) {
    next(error)
  }
}

// Lisää elokuva ryhmän listalle
export const addMovieToGroupList = async (req, res, next) => {
  try {
    const userId = req.user.id
    const listId = parseId(req.params.id)
    const tmdbMovieId = parseId(req.body.tmdbMovieId)

    if (!listId) {
      return res.status(400).json({
        message: 'Virheellinen listan tunnus'
      })
    }

    if (!tmdbMovieId) {
      return res.status(400).json({
        message: 'Virheellinen elokuvan tunnus'
      })
    }

    const listResult = await pool.query(
      `SELECT id, owner_id
       FROM lists
       WHERE id = $1
         AND owner_type = 'group'`,
      [listId]
    )

    if (listResult.rows.length === 0) {
      return res.status(404).json({
        message: 'Listaa ei löytynyt'
      })
    }

    const groupId = listResult.rows[0].owner_id

    const adminResult = await pool.query(
      `SELECT 1
       FROM group_members
       WHERE group_id = $1
         AND user_id = $2
         AND role = 'admin'
         AND status = 'active'`,
      [groupId, userId]
    )

    if (adminResult.rows.length === 0) {
      return res.status(403).json({
        message: 'Vain ryhmän ylläpitäjä voi lisätä elokuvia'
      })
    }

    const countResult = await pool.query(
      'SELECT COUNT(*)::int AS count FROM list_movies WHERE list_id = $1',
      [listId]
    )

    if (countResult.rows[0].count >= MAX_MOVIES_PER_LIST) {
      return res.status(400).json({
        message: `Listalla voi olla enintään ${MAX_MOVIES_PER_LIST} elokuvaa`
      })
    }

    let movie

    try {
      movie = await fetchMovieSummary(tmdbMovieId)
    } catch (error) {
      if (error.response?.status === 404) {
        return res.status(404).json({
          message: 'Elokuvaa ei löytynyt'
        })
      }

      throw error
    }

    const insertResult = await pool.query(
      `INSERT INTO list_movies (
         list_id,
         tmdb_movie_id,
         added_by
       )
       VALUES ($1, $2, $3)
       ON CONFLICT (list_id, tmdb_movie_id)
       DO NOTHING
       RETURNING id, added_at`,
      [listId, tmdbMovieId, userId]
    )

    if (insertResult.rows.length === 0) {
      return res.status(409).json({
        message: 'Elokuva on jo listalla'
      })
    }

    res.status(201).json({
      movie,
      added_at: insertResult.rows[0].added_at
    })
  } catch (error) {
    next(error)
  }
}

// Poista elokuva ryhmän listalta
export const removeMovieFromGroupList = async (req, res, next) => {
  try {
    const userId = req.user.id
    const listId = parseId(req.params.id)
    const tmdbMovieId = parseId(req.params.tmdbMovieId)

    if (!listId || !tmdbMovieId) {
      return res.status(400).json({
        message: 'Virheellinen tunnus'
      })
    }

    const listResult = await pool.query(
      `SELECT id, owner_id
       FROM lists
       WHERE id = $1
         AND owner_type = 'group'`,
      [listId]
    )

    if (listResult.rows.length === 0) {
      return res.status(404).json({
        message: 'Listaa ei löytynyt'
      })
    }

    const groupId = listResult.rows[0].owner_id

    const adminResult = await pool.query(
      `SELECT 1
       FROM group_members
       WHERE group_id = $1
         AND user_id = $2
         AND role = 'admin'
         AND status = 'active'`,
      [groupId, userId]
    )

    if (adminResult.rows.length === 0) {
      return res.status(403).json({
        message: 'Vain ryhmän ylläpitäjä voi poistaa elokuvia'
      })
    }

    const result = await pool.query(
      `DELETE FROM list_movies
       WHERE list_id = $1
         AND tmdb_movie_id = $2
       RETURNING id`,
      [listId, tmdbMovieId]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: 'Elokuvaa ei löytynyt listalta'
      })
    }

    res.status(200).json({
      message: 'Elokuva poistettiin listalta'
    })
  } catch (error) {
    next(error)
  }
}

// Vaihda ryhmän listan nimi
export const updateGroupList = async (req, res, next) => {
  try {
    const userId = req.user.id
    const listId = parseId(req.params.id)
    const { title } = req.body

    if (!listId) {
      return res.status(400).json({
        message: 'Virheellinen listan tunnus'
      })
    }

    if (typeof title !== 'string') {
      return res.status(400).json({
        message: 'Listan nimi on pakollinen'
      })
    }

    const trimmedTitle = title.trim()

    if (!trimmedTitle) {
      return res.status(400).json({
        message: 'Listan nimi ei voi olla tyhjä'
      })
    }

    if (trimmedTitle.length > MAX_TITLE_LENGTH) {
      return res.status(400).json({
        message: `Listan nimi voi olla enintään ${MAX_TITLE_LENGTH} merkkiä`,
      })
    }

    const listResult = await pool.query(
      `SELECT id, owner_id
       FROM lists
       WHERE id = $1
         AND owner_type = 'group'`,
      [listId]
    )

    if (listResult.rows.length === 0) {
      return res.status(404).json({
        message: 'Listaa ei löytynyt'
      })
    }

    const groupId = listResult.rows[0].owner_id

    const adminResult = await pool.query(
      `SELECT 1
       FROM group_members
       WHERE group_id = $1
         AND user_id = $2
         AND role = 'admin'
         AND status = 'active'`,
      [groupId, userId]
    )

    if (adminResult.rows.length === 0) {
      return res.status(403).json({
        message: 'Vain ryhmän ylläpitäjä voi muokata listoja'
      })
    }

    const result = await pool.query(
      `UPDATE lists
       SET title = $1
       WHERE id = $2
       RETURNING *`,
      [trimmedTitle, listId]
    )

    res.status(200).json(result.rows[0])
  } catch (error) {
    next(error)
  }
}

// Poista koko ryhmän lista
export const deleteGroupList = async (req, res, next) => {
  try {
    const userId = req.user.id
    const listId = parseId(req.params.id)

    if (!listId) {
      return res.status(400).json({
        message: 'Virheellinen listan tunnus'
      })
    }

    const listResult = await pool.query(
      `SELECT id, owner_id
       FROM lists
       WHERE id = $1
         AND owner_type = 'group'`,
      [listId]
    )

    if (listResult.rows.length === 0) {
      return res.status(404).json({
        message: 'Listaa ei löytynyt'
      })
    }

    const groupId = listResult.rows[0].owner_id

    const adminResult = await pool.query(
      `SELECT 1
       FROM group_members
       WHERE group_id = $1
         AND user_id = $2
         AND role = 'admin'
         AND status = 'active'`,
      [groupId, userId]
    )

    if (adminResult.rows.length === 0) {
      return res.status(403).json({
        message: 'Vain ryhmän ylläpitäjä voi poistaa listoja'
      })
    }

    await pool.query(
      `DELETE FROM lists
       WHERE id = $1`,
      [listId]
    )

    res.status(200).json({
      message: 'Lista poistettiin'
    })
  } catch (error) {
    next(error)
  }
}