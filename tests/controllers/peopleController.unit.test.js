import axios from 'axios'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import {
  getPersonDetails,
  searchPeople,
} from '../../api/controllers/peopleController.js'

vi.mock('axios')

const createResponse = () => ({
  status: vi.fn().mockReturnThis(),
  json: vi.fn(),
})

describe('peopleController', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('searchPeople rejects a missing query without calling TMDB', async () => {
    const response = createResponse()

    await searchPeople({ query: {} }, response, vi.fn())

    expect(response.status).toHaveBeenCalledWith(400)
    expect(response.json).toHaveBeenCalledWith({
      error: 'Hakutermi (q) puuttuu',
    })
    expect(axios.get).not.toHaveBeenCalled()
  })

  test('getPersonDetails combines details and sorted cast credits', async () => {
    const response = createResponse()
    const next = vi.fn()

    axios.get
      .mockResolvedValueOnce({
        data: { id: 31, name: 'Tom Hanks' },
      })
      .mockResolvedValueOnce({
        data: {
          cast: [
            { id: 2, title: 'Older Movie', release_date: '1995-01-01', poster_path: '/old.jpg' },
            { id: 1, title: 'Newer Movie', release_date: '2020-01-01', poster_path: '/new.jpg' },
          ],
        },
      })

    await getPersonDetails({ params: { id: '31' } }, response, next)

    expect(response.status).toHaveBeenCalledWith(200)
    expect(response.json).toHaveBeenCalledWith({
      id: 31,
      name: 'Tom Hanks',
      movieCredits: [
        { id: 1, title: 'Newer Movie', release_date: '2020-01-01', poster_path: '/new.jpg' },
        { id: 2, title: 'Older Movie', release_date: '1995-01-01', poster_path: '/old.jpg' },
      ],
    })
    expect(next).not.toHaveBeenCalled()
  })
})
