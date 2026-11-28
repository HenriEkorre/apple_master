import { beforeEach, expect, test, vi } from 'vitest'
import { pool } from '../../api/models/db.js'
import { getMovieReviews } from '../../api/controllers/reviewController.js'

vi.mock('../../api/models/db.js', () => ({
  pool: {
    query: vi.fn(),
  },
}))

const createResponse = () => ({
  status: vi.fn().mockReturnThis(),
  json: vi.fn(),
})

const groupReviewRows = [
  {
    group_id: 10,
    group_name: 'Friends',
    id: 8,
    user_id: 2,
    username: 'other',
    visibility: 'public',
  },
  {
    group_id: 20,
    group_name: 'Family',
    id: 8,
    user_id: 2,
    username: 'other',
    visibility: 'public',
  },
]

beforeEach(() => {
  vi.clearAllMocks()
})

test('returns group reviews separately for each active shared group', async () => {
  const response = createResponse()
  pool.query
    .mockResolvedValueOnce({
      rows: [{ review_count: 1, average_rating: 4 }],
    })
    .mockResolvedValueOnce({ rows: [{ id: 8, user_id: 2, username: 'other' }] })
    .mockResolvedValueOnce({ rows: groupReviewRows })
    .mockResolvedValueOnce({
      rows: [{ id: 3, rating: 5, comment: 'Great', created_at: 'date' }],
    })

  await getMovieReviews(
    { params: { tmdbId: '123' }, user: { id: 1, username: 'me' } },
    response,
    vi.fn()
  )

  expect(response.status).toHaveBeenCalledWith(200)
  expect(response.json).toHaveBeenCalledWith(
    expect.objectContaining({
      group_reviews: [
        {
          group_id: 10,
          group_name: 'Friends',
          reviews: [expect.objectContaining({ id: 8, visibility: 'public' })],
        },
        {
          group_id: 20,
          group_name: 'Family',
          reviews: [expect.objectContaining({ id: 8, visibility: 'public' })],
        },
      ],
    })
  )

  const groupQuery = pool.query.mock.calls[2][0]
  expect(groupQuery).toContain('gm_other.status = \'active\'')
  expect(groupQuery).toContain('gm_me.status = \'active\'')
  expect(groupQuery).toContain('PARTITION BY g.id')
})

test('returns an empty group_reviews list to anonymous users', async () => {
  const response = createResponse()
  pool.query
    .mockResolvedValueOnce({
      rows: [{ review_count: 0, average_rating: null }],
    })
    .mockResolvedValueOnce({ rows: [] })

  await getMovieReviews({ params: { tmdbId: '123' } }, response, vi.fn())

  expect(response.json).toHaveBeenCalledWith(
    expect.objectContaining({ group_reviews: [] })
  )
  expect(pool.query).toHaveBeenCalledTimes(2)
})
