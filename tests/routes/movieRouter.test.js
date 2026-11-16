import express from 'express'
import request from 'supertest'
import axios from 'axios'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import movieRouter from '../../../api/routes/movieRouter.js'

vi.mock('axios')

const app = express()
app.use('/api/movies', movieRouter)

describe('movieRouter', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('routes popular movies to the popular controller', async () => {
    axios.get.mockResolvedValueOnce({ data: { results: [{ id: 1 }] } })

    const response = await request(app).get('/api/movies/popular')

    expect(response.status).toBe(200)
    expect(response.body).toEqual([{ id: 1 }])
    expect(axios.get).toHaveBeenCalledWith(
      'https://api.themoviedb.org/3/movie/popular',
      expect.any(Object),
    )
  })

  test('routes searches and preserves the q query parameter', async () => {
    axios.get.mockResolvedValueOnce({ data: { results: [{ id: 2 }] } })

    const response = await request(app).get('/api/movies/search?q=star%20wars')

    expect(response.status).toBe(200)
    expect(response.body).toEqual([{ id: 2 }])
    expect(axios.get).toHaveBeenCalledWith(
      'https://api.themoviedb.org/3/search/movie',
      {
        params: {
          api_key: undefined,
          query: 'star wars',
          language: 'fi-FI',
        },
      },
    )
  })

  test('routes movie IDs to the details controller', async () => {
    axios.get.mockResolvedValueOnce({ data: { id: 550, title: 'Fight Club' } })
    axios.get.mockResolvedValueOnce({ data: { results: [] } })

    const response = await request(app).get('/api/movies/550')

    expect(response.status).toBe(200)
    expect(response.body).toEqual({ id: 550, title: 'Fight Club', trailer: null })
  })
})
