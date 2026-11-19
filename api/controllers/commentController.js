import {
  createComment as insertComment,
  findCommentsByUserId,
} from '../repositories/userActivityRepository.js'

// Hae kirjautuneen käyttäjän omat kommentit
export const getMyComments = async (req, res, next) => {
  try {
    const userId = req.user.id

    const comments = await findCommentsByUserId(userId)
    res.status(200).json(comments)
  } catch (error) {
    next(error)
  }
}

// Lisää uusi kommentti
export const createComment = async (req, res, next) => {
  try {
    const userId = req.user.id
    // Käytetään suoraan movieId-kenttää comments-taulussa
    const movieId = req.body.movieId || req.body.tmdb_movie_id
    const { content } = req.body

    if (!movieId || !content) {
      return res.status(400).json({ error: 'Movie ID and content are required' })
    }

    const commentRow = await insertComment(userId, movieId, content)
    res.status(201).json(commentRow)
  } catch (error) {
    next(error)
  }
}