import {
  createHistoryEntry,
  findHistoryByUserId,
} from '../repositories/userActivityRepository.js'

// Hae kirjautuneen käyttäjän katseluhistoria aikajärjestyksessä
export const getMyHistory = async (req, res, next) => {
  try {
    const userId = req.user.id

    const history = await findHistoryByUserId(userId)
    res.status(200).json(history)
  } catch (error) {
    next(error)
  }
}

// Lisää elokuva katseluhistoriaan
export const addToHistory = async (req, res, next) => {
  try {
    const userId = req.user.id
    const { movieId } = req.body

    if (!movieId) {
      return res.status(400).json({ error: 'Movie ID is required' })
    }

    const entry = await createHistoryEntry(userId, movieId)
    res.status(201).json(entry)
  } catch (error) {
    next(error)
  }
}