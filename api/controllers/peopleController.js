import {
  getPersonDetails as fetchPersonDetails,
  searchPeople as fetchSearchPeople,
} from '../clients/tmdbClient.js'

export const searchPeople = async (req, res, next) => {
  try {
    const queryTerm = req.query.q

    if (!queryTerm) {
      return res.status(400).json({ error: 'Hakutermi (q) puuttuu' })
    }

    const people = await fetchSearchPeople(queryTerm)
    res.status(200).json(people)
  } catch (error) {
    next(error)
  }
}

export const getPersonDetails = async (req, res, next) => {
  try {
    const personId = req.params.id
    const { details, cast } = await fetchPersonDetails(personId)
    const filteredCast = Array.isArray(cast)
      ? cast
        .filter((movie) => movie.poster_path)
        .sort((a, b) => (b.release_date || '').localeCompare(a.release_date || ''))
      : []

    res.status(200).json({
      ...details,
      movieCredits: filteredCast,
    })
  } catch (error) {
    next(error)
  }
}
