import { beforeEach, describe, expect, test, vi } from 'vitest'

const { queryMock } = vi.hoisted(() => ({
  queryMock: vi.fn(),
}))

vi.mock('../../api/models/db.js', () => ({
  pool: { query: queryMock },
}))

const { getProfile } = await import('../../api/controllers/profileController.js')

const createResponse = () => ({
  status: vi.fn().mockReturnThis(),
  json: vi.fn(),
})

describe('getProfile', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test.each(['', 'abc', undefined])(
    'returns an empty array for invalid id %s',
    async (id) => {
      const response = createResponse()

      await getProfile({ params: { id } }, response, vi.fn())

      expect(response.status).toHaveBeenCalledWith(200)
      expect(response.json).toHaveBeenCalledWith([])
      expect(queryMock).not.toHaveBeenCalled()
    },
  )

  test('combines the user and active group profile data', async () => {
    const response = createResponse()
    const next = vi.fn()

    queryMock
      .mockResolvedValueOnce({
        rows: [{ id: 1, username: 'alice', created_at: '2026-01-01' }],
      })
      .mockResolvedValueOnce({
        rows: [{ id: 10, name: 'Sci-fi', type: 'public' }],
      })

    await getProfile({ params: { id: '1' } }, response, next)

    expect(response.status).toHaveBeenCalledWith(200)
    expect(response.json).toHaveBeenCalledWith({
      user: [{ id: 1, username: 'alice', created_at: '2026-01-01' }],
      groups: [{
        id: 10,
        name: 'Sci-fi',
        type: 'public',
        link: '/groups/10',
      }],
    })
    expect(next).not.toHaveBeenCalled()
  })

  test('passes database errors to next', async () => {
    const response = createResponse()
    const next = vi.fn()
    const error = new Error('database unavailable')
    queryMock.mockRejectedValueOnce(error)

    await getProfile({ params: { id: '1' } }, response, next)

    expect(next).toHaveBeenCalledWith(error)
  })
})
