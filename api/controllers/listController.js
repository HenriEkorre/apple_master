import axios from 'axios'
import { pool } from '../models/db.js'

const MAX_INT = 2147483647
const MAX_TITLE_LENGTH = 255 // lists.title on VARCHAR(255)
const MAX_MOVIES_PER_LIST = 50 // elokuvien tiedot haetaan TMDB:stä listaa avattaessa

// Palauttaa positiivisen kokonaisluvun tai null, jos arvo ei kelpaa
const parseId = (value) => {
  const number = Number(value)
  return Number.isInteger(number) && number > 0 && number <= MAX_INT
    ? number
    : null
}

// Hae yksi elokuva TMDB:stä ja palauta vain tarvittavat kentät
const fetchMovieSummary = async (tmdbMovieId) => {
  const response = await axios.get(
    `https://api.themoviedb.org/3/movie/${tmdbMovieId}`,
    {
      params: { api_key: process.env.TMDB_API_KEY, language: 'fi-FI' },
      timeout: 8000,
    },
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
      : { id: ids[index], title: null, unavailable: true },
  )
}

// Hae lista vain, jos se kuuluu tälle käyttäjälle
const findOwnedList = async (listId, userId) => {
  const result = await pool.query(
    `SELECT * FROM lists
     WHERE id = $1 AND owner_type = 'user' AND owner_id = $2`,
    [listId, userId],
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
        return res
          .status(400)
          .json({ message: 'Virheellinen elokuvan tunnus' })
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
      [userId, movieId],
    )

    res.status(200).json(result.rows)
  } catch (error) {
    next(error)
  }
}

// Luo uusi toivelista kirjautuneelle käyttäjälle
export const createList = async (req, res, next) => {
  const userId = req.user.id
  const {
    title,
    visibility = 'private',
    groupIds = [],
  } = req.body

  // Nimen pitää olla merkkijono
  if (typeof title !== 'string') {
    return res.status(400).json({
      message: 'Listan nimi on pakollinen',
    })
  }

  // Tyhjää nimeä ei hyväksytä (myöskään pelkkiä välilyöntejä)
  const trimmedTitle = title.trim()

  if (!trimmedTitle) {
    return res.status(400).json({
      message: 'Listan nimi ei voi olla tyhjä',
    })
  }

  if (trimmedTitle.length > MAX_TITLE_LENGTH) {
    return res.status(400).json({
      message: `Listan nimi voi olla enintään ${MAX_TITLE_LENGTH} merkkiä`,
    })
  }

  // Käyttäjän listalle sallitaan tässä vaiheessa private ja shared
  if (!['private', 'shared'].includes(visibility)) {
    return res.status(400).json({
      message: 'Virheellinen listan näkyvyys',
    })
  }

  if (!Array.isArray(groupIds)) {
    return res.status(400).json({
      message: 'Ryhmien tunnusten pitää olla taulukossa',
    })
  }

  // Muutetaan ryhmien tunnukset numeroiksi ja tarkistetaan niiden kelvollisuus
  const parsedGroupIds = groupIds.map(parseId)

  if (parsedGroupIds.some((groupId) => groupId === null)) {
    return res.status(400).json({
      message: 'Virheellinen ryhmän tunnus',
    })
  }

  // Sama ryhmä saa esiintyä pyynnössä vain kerran
  const uniqueGroupIds = [...new Set(parsedGroupIds)]

  if (uniqueGroupIds.length !== parsedGroupIds.length) {
    return res.status(400).json({
      message: 'Sama ryhmä on valittu useammin kuin kerran',
    })
  }

  if (visibility === 'shared' && uniqueGroupIds.length === 0) {
    return res.status(400).json({
      message: 'Valitse vähintään yksi ryhmä',
    })
  }

  // Yksityiselle listalle ei tallenneta ryhmäjakoja
  const selectedGroupIds =
    visibility === 'shared'
      ? uniqueGroupIds
      : []

  let client

  try {
    client = await pool.connect()
    await client.query('BEGIN')

    if (visibility === 'shared') {
      // Tarkistetaan, että käyttäjä on jokaisen valitun ryhmän aktiivinen jäsen
      const membershipsResult = await client.query(
        `SELECT group_id
         FROM group_members
         WHERE user_id = $1
           AND status = 'active'
           AND group_id = ANY($2::int[])`,
        [userId, selectedGroupIds]
      )

      const activeGroupIds = new Set(
        membershipsResult.rows.map((row) => row.group_id)
      )

      const belongsToEveryGroup = selectedGroupIds.every(
        (groupId) => activeGroupIds.has(groupId)
      )

      if (!belongsToEveryGroup) {
        await client.query('ROLLBACK')

        return res.status(403).json({
          message: 'Et kuulu kaikkiin valittuihin ryhmiin',
        })
      }
    }

    // Lista säilyy käyttäjän omistamana myös silloin, kun se jaetaan ryhmille
    const listResult = await client.query(
      `INSERT INTO lists (
         title,
         owner_type,
         owner_id,
         visibility
       )
       VALUES ($1, 'user', $2, $3)
       RETURNING *`,
      [trimmedTitle, userId, visibility]
    )

    const newList = listResult.rows[0]

    if (visibility === 'shared') {
      // Lisätään kaikki ryhmäjaot yhdellä kyselyllä
      await client.query(
        `INSERT INTO list_groups (
           list_id,
           group_id
         )
         SELECT $1, UNNEST($2::int[])`,
        [newList.id, selectedGroupIds]
      )
    }

    await client.query('COMMIT')

    return res.status(201).json({
      ...newList,
      movie_count: 0,
      group_ids: selectedGroupIds,
    })
  } catch (error) {
    if (client) {
      try {
        await client.query('ROLLBACK')
      } catch (rollbackError) {
        console.error(
          'Listan luonnin rollback epäonnistui:',
          rollbackError
        )
      }
    }

    return next(error)
  } finally {
    client?.release()
  }
}

// Hae yksittäinen lista elokuvineen
export const getListById = async (req, res, next) => {
  try {
    const userId = req.user.id
    const listId = parseId(req.params.id)

    if (!listId) {
      return res.status(400).json({
        message: 'Virheellinen listan tunnus',
      })
    }

    /*
     * Käyttäjä saa nähdä listan, jos:
     *
     * 1. käyttäjä omistaa käyttäjälistan
     * 2. käyttäjä on ryhmän omistaman listan aktiivinen jäsen
     * 3. käyttäjälista on jaettu käyttäjän aktiiviseen ryhmään
     * 4. lista on julkinen
     */
    const listResult = await pool.query(
      `SELECT
         l.*,
         CASE
           WHEN l.owner_type = 'user'
             AND l.owner_id = $2
             THEN true
           WHEN l.owner_type = 'group'
             AND EXISTS (
               SELECT 1
               FROM group_members admin_gm
               WHERE admin_gm.group_id = l.owner_id
                 AND admin_gm.user_id = $2
                 AND admin_gm.role = 'admin'
                 AND admin_gm.status = 'active'
             )
             THEN true
           ELSE false
         END AS can_manage
       FROM lists l
       WHERE l.id = $1
         AND (
           (
             l.owner_type = 'user'
             AND l.owner_id = $2
           )
           OR
           (
             l.owner_type = 'group'
             AND EXISTS (
               SELECT 1
               FROM group_members gm
               WHERE gm.group_id = l.owner_id
                 AND gm.user_id = $2
                 AND gm.status = 'active'
             )
           )
           OR
           (
             l.owner_type = 'user'
             AND l.visibility = 'shared'
             AND EXISTS (
               SELECT 1
               FROM list_groups lg
               JOIN group_members gm
                 ON gm.group_id = lg.group_id
               WHERE lg.list_id = l.id
                 AND gm.user_id = $2
                 AND gm.status = 'active'
             )
           )
           OR
           l.visibility = 'public'
         )`,
      [listId, userId]
    )

    const list = listResult.rows[0]

    if (!list) {
      return res.status(404).json({
        message: 'Listaa ei löytynyt',
      })
    }

    // Omistaja näkee kaikki jakoryhmät.
    // Muu katselija näkee vain ryhmät, joissa hän on aktiivinen jäsen.
    const groupsResult = await pool.query(
      `SELECT DISTINCT
     g.id,
     g.name
   FROM list_groups lg
   JOIN groups g
     ON g.id = lg.group_id
   WHERE lg.list_id = $1
     AND (
       $3::boolean = true
       OR EXISTS (
         SELECT 1
         FROM group_members gm
         WHERE gm.group_id = lg.group_id
           AND gm.user_id = $2
           AND gm.status = 'active'
       )
     )
   ORDER BY g.name ASC, g.id ASC`,
      [listId, userId, list.can_manage],
    )

    // Uusimmat elokuvat ensin
    const moviesResult = await pool.query(
      `SELECT tmdb_movie_id
       FROM list_movies
       WHERE list_id = $1
       ORDER BY added_at DESC, id DESC`,
      [listId]
    )

    const movies = await fetchMovieSummaries(
      moviesResult.rows.map((row) => row.tmdb_movie_id)
    )

    return res.status(200).json({
      ...list,
      groups: groupsResult.rows,
      movies,
    })
  } catch (error) {
    return next(error)
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
      [listId],
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
      [listId, tmdbMovieId, userId],
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
      [listId, userId, tmdbMovieId],
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
      [trimmedTitle, listId, userId],
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Listaa ei löytynyt' })
    }

    res.status(200).json(result.rows[0])
  } catch (error) {
    next(error)
  }
}

// Muuta käyttäjän omistaman listan näkyvyyttä ja valittuja ryhmiä
export const updateListSharing = async (req, res, next) => {
  const userId = req.user.id
  const listId = parseId(req.params.id)
  const {
    visibility,
    groupIds = [],
  } = req.body

  if (!listId) {
    return res.status(400).json({
      message: 'Virheellinen listan tunnus',
    })
  }

  // Käyttäjän listalle sallitaan tässä vaiheessa private ja shared
  if (!['private', 'shared'].includes(visibility)) {
    return res.status(400).json({
      message: 'Virheellinen listan näkyvyys',
    })
  }

  if (!Array.isArray(groupIds)) {
    return res.status(400).json({
      message: 'Ryhmien tunnusten pitää olla taulukossa',
    })
  }

  // Muutetaan ryhmien tunnukset numeroiksi ja tarkistetaan niiden kelvollisuus
  const parsedGroupIds = groupIds.map(parseId)

  if (parsedGroupIds.some((groupId) => groupId === null)) {
    return res.status(400).json({
      message: 'Virheellinen ryhmän tunnus',
    })
  }

  // Sama ryhmä saa esiintyä pyynnössä vain kerran
  const uniqueGroupIds = [...new Set(parsedGroupIds)]

  if (uniqueGroupIds.length !== parsedGroupIds.length) {
    return res.status(400).json({
      message: 'Sama ryhmä on valittu useammin kuin kerran',
    })
  }

  if (visibility === 'shared' && uniqueGroupIds.length === 0) {
    return res.status(400).json({
      message: 'Valitse vähintään yksi ryhmä',
    })
  }

  // Yksityiselle listalle ei tallenneta ryhmäjakoja
  const selectedGroupIds =
    visibility === 'shared'
      ? uniqueGroupIds
      : []

  let client

  try {
    client = await pool.connect()
    await client.query('BEGIN')

    // Vain käyttäjän omistamaa henkilökohtaista listaa voi jakaa
    const listResult = await client.query(
      `SELECT id, title, owner_type, owner_id, visibility
       FROM lists
       WHERE id = $1
         AND owner_type = 'user'
         AND owner_id = $2
       FOR UPDATE`,
      [listId, userId]
    )

    if (listResult.rows.length === 0) {
      await client.query('ROLLBACK')

      return res.status(404).json({
        message: 'Listaa ei löytynyt',
      })
    }

    if (visibility === 'shared') {
      // Tarkistetaan, että käyttäjä on jokaisen valitun ryhmän aktiivinen jäsen
      const membershipsResult = await client.query(
        `SELECT group_id
         FROM group_members
         WHERE user_id = $1
           AND status = 'active'
           AND group_id = ANY($2::int[])`,
        [userId, selectedGroupIds]
      )

      const activeGroupIds = new Set(
        membershipsResult.rows.map((row) => row.group_id)
      )

      const belongsToEveryGroup = selectedGroupIds.every(
        (groupId) => activeGroupIds.has(groupId)
      )

      if (!belongsToEveryGroup) {
        await client.query('ROLLBACK')

        return res.status(403).json({
          message: 'Et kuulu kaikkiin valittuihin ryhmiin',
        })
      }
    }

    // Päivitetään listan näkyvyys
    const updatedListResult = await client.query(
      `UPDATE lists
       SET visibility = $1
       WHERE id = $2
         AND owner_type = 'user'
         AND owner_id = $3
       RETURNING *`,
      [visibility, listId, userId]
    )

    // Poistetaan vanhat ryhmäjaot myös silloin, kun lista muutetaan yksityiseksi
    await client.query(
      `DELETE FROM list_groups
       WHERE list_id = $1`,
      [listId]
    )

    if (visibility === 'shared') {
      // Tallennetaan pyynnössä valitut ryhmät uusiksi ryhmäjaoiksi
      await client.query(
        `INSERT INTO list_groups (
           list_id,
           group_id
         )
         SELECT $1, UNNEST($2::int[])`,
        [listId, selectedGroupIds]
      )
    }

    // Haetaan vastaukseen päivitettyjen ryhmien nimet
    const groupsResult = await client.query(
      `SELECT
         g.id,
         g.name
       FROM list_groups lg
       JOIN groups g
         ON g.id = lg.group_id
       WHERE lg.list_id = $1
       ORDER BY g.name ASC, g.id ASC`,
      [listId]
    )

    await client.query('COMMIT')

    return res.status(200).json({
      ...updatedListResult.rows[0],
      groups: groupsResult.rows,
      group_ids: selectedGroupIds,
      can_manage: true,
    })
  } catch (error) {
    if (client) {
      try {
        await client.query('ROLLBACK')
      } catch (rollbackError) {
        console.error(
          'Listan näkyvyyden rollback epäonnistui:',
          rollbackError
        )
      }
    }

    return next(error)
  } finally {
    client?.release()
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
      [listId, userId],
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
        message: 'Virheellinen ryhmän tunnus',
      })
    }

    if (typeof title !== 'string') {
      return res.status(400).json({
        message: 'Listan nimi on pakollinen',
      })
    }

    const trimmedTitle = title.trim()

    if (!trimmedTitle) {
      return res.status(400).json({
        message: 'Listan nimi ei voi olla tyhjä',
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
      [groupId],
    )

    if (groupResult.rows.length === 0) {
      return res.status(404).json({
        message: 'Ryhmää ei löytynyt',
      })
    }

    const adminResult = await pool.query(
      `SELECT 1
       FROM group_members
       WHERE group_id = $1
         AND user_id = $2
         AND role = 'admin'
         AND status = 'active'`,
      [groupId, userId],
    )

    if (adminResult.rows.length === 0) {
      return res.status(403).json({
        message: 'Vain ryhmän ylläpitäjä voi luoda listoja',
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
      [trimmedTitle, groupId],
    )

    res.status(201).json({
      ...result.rows[0],
      movie_count: 0,
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
        message: 'Virheellinen listan tunnus',
      })
    }

    if (!tmdbMovieId) {
      return res.status(400).json({
        message: 'Virheellinen elokuvan tunnus',
      })
    }

    const listResult = await pool.query(
      `SELECT id, owner_id
       FROM lists
       WHERE id = $1
         AND owner_type = 'group'`,
      [listId],
    )

    if (listResult.rows.length === 0) {
      return res.status(404).json({
        message: 'Listaa ei löytynyt',
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
      [groupId, userId],
    )

    if (adminResult.rows.length === 0) {
      return res.status(403).json({
        message: 'Vain ryhmän ylläpitäjä voi lisätä elokuvia',
      })
    }

    const countResult = await pool.query(
      'SELECT COUNT(*)::int AS count FROM list_movies WHERE list_id = $1',
      [listId],
    )

    if (countResult.rows[0].count >= MAX_MOVIES_PER_LIST) {
      return res.status(400).json({
        message: `Listalla voi olla enintään ${MAX_MOVIES_PER_LIST} elokuvaa`,
      })
    }

    let movie

    try {
      movie = await fetchMovieSummary(tmdbMovieId)
    } catch (error) {
      if (error.response?.status === 404) {
        return res.status(404).json({
          message: 'Elokuvaa ei löytynyt',
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
      [listId, tmdbMovieId, userId],
    )

    if (insertResult.rows.length === 0) {
      return res.status(409).json({
        message: 'Elokuva on jo listalla',
      })
    }

    res.status(201).json({
      movie,
      added_at: insertResult.rows[0].added_at,
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
        message: 'Virheellinen tunnus',
      })
    }

    const listResult = await pool.query(
      `SELECT id, owner_id
       FROM lists
       WHERE id = $1
         AND owner_type = 'group'`,
      [listId],
    )

    if (listResult.rows.length === 0) {
      return res.status(404).json({
        message: 'Listaa ei löytynyt',
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
      [groupId, userId],
    )

    if (adminResult.rows.length === 0) {
      return res.status(403).json({
        message: 'Vain ryhmän ylläpitäjä voi poistaa elokuvia',
      })
    }

    const result = await pool.query(
      `DELETE FROM list_movies
       WHERE list_id = $1
         AND tmdb_movie_id = $2
       RETURNING id`,
      [listId, tmdbMovieId],
    )

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: 'Elokuvaa ei löytynyt listalta',
      })
    }

    res.status(200).json({
      message: 'Elokuva poistettiin listalta',
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
        message: 'Virheellinen listan tunnus',
      })
    }

    if (typeof title !== 'string') {
      return res.status(400).json({
        message: 'Listan nimi on pakollinen',
      })
    }

    const trimmedTitle = title.trim()

    if (!trimmedTitle) {
      return res.status(400).json({
        message: 'Listan nimi ei voi olla tyhjä',
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
      [listId],
    )

    if (listResult.rows.length === 0) {
      return res.status(404).json({
        message: 'Listaa ei löytynyt',
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
      [groupId, userId],
    )

    if (adminResult.rows.length === 0) {
      return res.status(403).json({
        message: 'Vain ryhmän ylläpitäjä voi muokata listoja',
      })
    }

    const result = await pool.query(
      `UPDATE lists
       SET title = $1
       WHERE id = $2
       RETURNING *`,
      [trimmedTitle, listId],
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
        message: 'Virheellinen listan tunnus',
      })
    }

    const listResult = await pool.query(
      `SELECT id, owner_id
       FROM lists
       WHERE id = $1
         AND owner_type = 'group'`,
      [listId],
    )

    if (listResult.rows.length === 0) {
      return res.status(404).json({
        message: 'Listaa ei löytynyt',
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
      [groupId, userId],
    )

    if (adminResult.rows.length === 0) {
      return res.status(403).json({
        message: 'Vain ryhmän ylläpitäjä voi poistaa listoja',
      })
    }

    await pool.query(
      `DELETE FROM lists
       WHERE id = $1`,
      [listId],
    )

    res.status(200).json({
      message: 'Lista poistettiin',
    })
  } catch (error) {
    next(error)
  }
}

// Hae käyttäjälle ryhmien kautta näkyvät listat
export const getSharedLists = async (req, res, next) => {
  try {
    const userId = req.user.id

    const result = await pool.query(
      `
      SELECT *
      FROM (
        /*
         * Ryhmän omistamat listat.
         *
         * Lista näkyy käyttäjälle, kun käyttäjä on omistajaryhmän
         * aktiivinen jäsen.
         */
        SELECT
          l.*,
          g.name AS group_name,
          NULL::varchar AS owner_name,
          true AS is_group_owned,
          (
            SELECT COUNT(*)
            FROM list_movies lm
            WHERE lm.list_id = l.id
          )::int AS movie_count
        FROM lists l
        JOIN groups g
          ON g.id = l.owner_id
        JOIN group_members gm
          ON gm.group_id = g.id
        WHERE l.owner_type = 'group'
          AND gm.user_id = $1
          AND gm.status = 'active'

        UNION ALL

        /*
         * Käyttäjien omistamat shared-listat.
         *
         * Lista näkyy käyttäjälle, kun se on jaettu vähintään
         * yhteen ryhmään, jossa käyttäjä on aktiivinen jäsen.
         */
        SELECT
          l.*,
          STRING_AGG(
            DISTINCT g.name,
            ', '
            ORDER BY g.name
          ) AS group_name,
          u.username AS owner_name,
          false AS is_group_owned,
          (
            SELECT COUNT(*)
            FROM list_movies lm
            WHERE lm.list_id = l.id
          )::int AS movie_count
        FROM lists l
        JOIN users u
          ON u.id = l.owner_id
        JOIN list_groups lg
          ON lg.list_id = l.id
        JOIN groups g
          ON g.id = lg.group_id
        JOIN group_members gm
          ON gm.group_id = lg.group_id
        WHERE l.owner_type = 'user'
          AND l.visibility = 'shared'
          AND l.owner_id <> $1
          AND gm.user_id = $1
          AND gm.status = 'active'
        GROUP BY
          l.id,
          u.username
      ) AS shared_lists
      ORDER BY
        shared_lists.created_at ASC,
        shared_lists.id ASC
      `,
      [userId],
    )

    return res.status(200).json(result.rows)
  } catch (error) {
    return next(error)
  }
}

// Hae ryhmän listat (vain ryhmän aktiiviset jäsenet)
export const getGroupLists = async (req, res, next) => {
  try {
    const userId = req.user.id
    const groupId = parseId(req.params.groupId)

    if (!groupId) {
      return res.status(400).json({ message: 'Virheellinen ryhmän tunnus' })
    }

    const membership = await pool.query(
      `SELECT 1 FROM group_members
       WHERE group_id = $1 AND user_id = $2 AND status = 'active'`,
      [groupId, userId]
    )
    if (membership.rows.length === 0) {
      return res
        .status(403)
        .json({ message: 'Vain ryhmän jäsenet näkevät ryhmän listat' })
    }

    const result = await pool.query(
      `SELECT l.*,
        (SELECT COUNT(*) FROM list_movies lm WHERE lm.list_id = l.id)::int AS movie_count
       FROM lists l
       WHERE l.owner_type = 'group' AND l.owner_id = $1
       ORDER BY l.created_at ASC, l.id ASC`,
      [groupId]
    )

    res.status(200).json(result.rows)
  } catch (error) {
    next(error)
  }
}
