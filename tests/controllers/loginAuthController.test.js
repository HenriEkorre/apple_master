import { beforeEach, describe, expect, test, vi } from 'vitest'

const query = vi.fn()
const verify = vi.fn()

vi.mock('../../api/models/db.js', () => ({ pool: { query } }))
vi.mock('argon2', () => ({ default: { verify } }))

const { loginUser } = await import('../../api/controllers/authController.js')

const createResponse = () => ({
  status: vi.fn().mockReturnThis(),
  json: vi.fn(),
  cookie: vi.fn(),
})

describe('loginUser', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.JWT_SECRET = 'test-secret'
  })

  test('logs in successfully and sets an auth cookie', async () => {
    const response = createResponse()
    query.mockResolvedValueOnce({
      rows: [{
        id: 1,
        username: 'alice',
        email: 'alice@example.com',
        password_hash: 'hash',
      }],
    })
    verify.mockResolvedValueOnce(true)

    await loginUser(
      { body: { email: 'alice@example.com', password: 'secret' } },
      response,
      vi.fn(),
    )

    expect(verify).toHaveBeenCalledWith('hash', 'secret')
    expect(response.cookie).toHaveBeenCalledWith(
      'auth',
      expect.any(String),
      expect.objectContaining({
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        maxAge: 30 * 60 * 1000,
      }),
    )
    expect(response.json).toHaveBeenCalledWith({
      user: { id: 1, username: 'alice', email: 'alice@example.com' },
    })
  })

  test.each([
    ['email', { password: 'secret' }],
    ['password', { email: 'alice@example.com' }],
  ])('rejects login without %s', async (_field, body) => {
    const response = createResponse()

    await loginUser({ body }, response, vi.fn())

    expect(response.status).toHaveBeenCalledWith(400)
    expect(query).not.toHaveBeenCalled()
  })

  test('rejects an unknown email', async () => {
    const response = createResponse()
    query.mockResolvedValueOnce({ rows: [] })

    await loginUser(
      { body: { email: 'unknown@example.com', password: 'secret' } },
      response,
      vi.fn(),
    )

    expect(response.status).toHaveBeenCalledWith(401)
    expect(response.cookie).not.toHaveBeenCalled()
  })

  test('rejects an incorrect password', async () => {
    const response = createResponse()
    query.mockResolvedValueOnce({
      rows: [{
        id: 1,
        username: 'alice',
        email: 'alice@example.com',
        password_hash: 'hash',
      }],
    })
    verify.mockResolvedValueOnce(false)

    await loginUser(
      { body: { email: 'alice@example.com', password: 'wrong' } },
      response,
      vi.fn(),
    )

    expect(response.status).toHaveBeenCalledWith(401)
    expect(response.cookie).not.toHaveBeenCalled()
  })

  test('passes database errors to next', async () => {
    const response = createResponse()
    const next = vi.fn()
    const error = new Error('database unavailable')
    query.mockRejectedValueOnce(error)

    await loginUser(
      { body: { email: 'alice@example.com', password: 'secret' } },
      response,
      next,
    )

    expect(next).toHaveBeenCalledWith(error)
  })
})
