import axios from 'axios'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import {
  getMovieDetails,
  getPopularMovies,
  searchMovies,
} from '../../api/controllers/movieController.js'

vi.mock('axios')

const createResponse = () => ({
  status: vi.fn().mockReturnThis(),
  json: vi.fn(),
})

describe('movieController unit tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('getPopularMovies returns TMDB results', async () => {
    const response = createResponse()
    axios.get.mockResolvedValueOnce({
      data: { results: [{ id: 1, title: 'Inception' }] },
    })

    await getPopularMovies({}, response, vi.fn())

    expect(response.status).toHaveBeenCalledWith(200)
    expect(response.json).toHaveBeenCalledWith([{ id: 1, title: 'Inception' }])
  })

  test('getPopularMovies calls next when TMDB rejects', async () => {
    const response = createResponse()
    const next = vi.fn()
    const error = new Error('TMDB unavailable')
    axios.get.mockRejectedValueOnce(error)

    await getPopularMovies({}, response, next)

    expect(next).toHaveBeenCalledWith(error)
    expect(response.status).not.toHaveBeenCalled()
  })

  test('searchMovies rejects a missing query without calling TMDB', async () => {
    const response = createResponse()

    await searchMovies({ query: {} }, response, vi.fn())

    expect(response.status).toHaveBeenCalledWith(400)
    expect(response.json).toHaveBeenCalledWith({
      error: 'Hakutermi (q) puuttuu',
    })
    expect(axios.get).not.toHaveBeenCalled()
  })

  test('searchMovies calls next when TMDB rejects', async () => {
    const response = createResponse()
    const next = vi.fn()
    const error = new Error('Search service unavailable')
    axios.get.mockRejectedValueOnce(error)

    await searchMovies({ query: { q: 'batman' } }, response, next)

    expect(next).toHaveBeenCalledWith(error)
    expect(response.status).not.toHaveBeenCalled()
  })

  test('getMovieDetails returns the requested movie', async () => {
    const response = createResponse()
    const movie = { id: 550, title: 'Fight Club' }
    axios.get.mockResolvedValueOnce({ data: movie })
    axios.get.mockResolvedValueOnce({ data: { results: [] } })

    await getMovieDetails({ params: { id: '550' } }, response, vi.fn())

    expect(response.status).toHaveBeenCalledWith(200)
    expect(response.json).toHaveBeenCalledWith({ ...movie, trailer: null })
    expect(axios.get).toHaveBeenCalledWith(
      'https://api.themoviedb.org/3/movie/550',
      {
        params: {
          api_key: undefined,
          language: 'fi-FI',
        },
      },
    )
  })

  test('getMovieDetails calls next when TMDB rejects', async () => {
    const response = createResponse()
    const next = vi.fn()
    const error = new Error('Movie not found')
    axios.get.mockRejectedValueOnce(error)

    await getMovieDetails({ params: { id: '999999' } }, response, next)

    expect(next).toHaveBeenCalledWith(error)
    expect(response.status).not.toHaveBeenCalled()
  })
})
