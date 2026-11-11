import { beforeEach, describe, expect, test, vi } from 'vitest'

const query = vi.fn()
const hash = vi.fn()

vi.mock('../../api/models/db.js', () => ({ pool: { query } }))
vi.mock('argon2', () => ({ default: { hash } }))

const { registerUser } = await import('../../api/controllers/authController.js')

const createResponse = () => ({
  status: vi.fn().mockReturnThis(),
  json: vi.fn(),
})

describe('registerUser', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('registers a new user successfully', async () => {
    const response = createResponse()
    hash.mockResolvedValueOnce('hashed-password')
    query
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [{ id: 1 }] })

    await registerUser(
      { body: { username: 'alice', email: 'alice@example.com', password: 'secret' } },
      response,
      vi.fn(),
    )

    expect(hash).toHaveBeenCalledWith('secret')
    expect(query).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('INSERT INTO users'),
      ['alice', 'alice@example.com', 'hashed-password'],
    )
    expect(response.status).toHaveBeenCalledWith(201)
  })

  test.each([
    ['username', { email: 'alice@example.com', password: 'secret' }],
    ['email', { username: 'alice', password: 'secret' }],
    ['password', { username: 'alice', email: 'alice@example.com' }],
  ])('rejects registration without %s', async (_field, body) => {
    const response = createResponse()

    await registerUser({ body }, response, vi.fn())

    expect(response.status).toHaveBeenCalledWith(400)
    expect(query).not.toHaveBeenCalled()
    expect(hash).not.toHaveBeenCalled()
  })

  test('rejects a username or email that is already used', async () => {
    const response = createResponse()
    query.mockRejectedValueOnce({ code: '23505' })

    await registerUser(
      { body: { username: 'alice', email: 'alice@example.com', password: 'secret' } },
      response,
      vi.fn(),
    )

    expect(response.status).toHaveBeenCalledWith(409)
    expect(response.json).toHaveBeenCalledWith({
      error: 'Sähköposti tai käyttäjänimi on jo käytössä',
    })
  })

  test('passes unexpected database errors to next', async () => {
    const response = createResponse()
    const next = vi.fn()
    const error = new Error('database unavailable')
    query.mockRejectedValueOnce(error)

    await registerUser(
      { body: { username: 'alice', email: 'alice@example.com', password: 'secret' } },
      response,
      next,
    )

    expect(next).toHaveBeenCalledWith(error)
  })
})
