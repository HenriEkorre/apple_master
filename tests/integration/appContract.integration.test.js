import request from 'supertest'
import { beforeEach, describe, expect, test, vi } from 'vitest'

const { queryMock, axiosGetMock } = vi.hoisted(() => ({
  queryMock: vi.fn(),
  axiosGetMock: vi.fn(),
}))

vi.mock('../../api/models/db.js', () => ({
  pool: { query: queryMock },
}))

vi.mock('axios', () => ({
  default: { get: axiosGetMock },
}))

process.env.NODE_ENV = 'test'
process.env.JWT_SECRET = 'test-secret'
process.env.APP_ORIGIN = 'http://127.0.0.1:5173'

const { default: app } = await import('../../api/app.js')

describe('application HTTP contract', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('database health endpoint reports connected status', async () => {
    queryMock.mockResolvedValueOnce({ rows: [{ '?column?': 1 }] })

    const response = await request(app).get('/api/health')

    expect(response.status).toBe(200)
    expect(response.body).toMatchObject({
      status: 'healthy',
      database: 'connected',
    })
    expect(queryMock).toHaveBeenCalledWith('SELECT 1')
  })

  test('database health endpoint reports unhealthy status', async () => {
    queryMock.mockRejectedValueOnce(new Error('database unavailable'))

    const response = await request(app).get('/api/health')

    expect(response.status).toBe(500)
    expect(response.body).toMatchObject({
      status: 'unhealthy',
      database: 'disconnected',
      error: 'database unavailable',
    })
  })

  test('unknown API routes use the not-found contract', async () => {
    const response = await request(app).get('/api/unknown')

    expect(response.status).toBe(404)
    expect(response.body).toEqual({
      error: {
        message: 'Not found',
        status: 404,
      },
    })
  })

  test('mutating requests reject an unconfigured origin', async () => {
    const response = await request(app)
      .post('/api/comments')
      .set('Origin', 'https://evil.example')
      .send({ movieId: 550, content: 'Great' })

    expect(response.status).toBe(403)
    expect(response.body).toEqual({ error: 'Virheellinen Origin' })
  })

  test.each([
    ['/api/groups/my', 'get'],
    ['/api/lists/my', 'get'],
    ['/api/reviews/me', 'get'],
    ['/api/comments/me', 'get'],
    ['/api/history/me', 'get'],
  ])('%s requires authentication', async (url, method) => {
    const response = await request(app)[method](url)

    expect(response.status).toBe(401)
    expect(response.body).toEqual({ error: 'Kirjautuminen vaaditaan' })
  })

  test('browse-groups public route returns database rows', async () => {
    queryMock.mockResolvedValueOnce({
      rows: [{ id: 10, name: 'Sci-fi', type: 'public' }],
    })

    const response = await request(app).get('/api/groups/browse')

    expect(response.status).toBe(200)
    expect(response.body).toEqual([
      { id: 10, name: 'Sci-fi', type: 'public' },
    ])
  })

  test('people search preserves the required query validation', async () => {
    const response = await request(app).get('/api/people/search')

    expect(response.status).toBe(400)
    expect(response.body).toEqual({
      error: 'Hakutermi (q) puuttuu',
    })
    expect(axiosGetMock).not.toHaveBeenCalled()
  })

  test('profile route returns an empty array for an invalid id', async () => {
    const response = await request(app).get('/api/profile/not-a-number')

    expect(response.status).toBe(200)
    expect(response.body).toEqual([])
  })
})
