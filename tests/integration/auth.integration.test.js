import request from 'supertest'
import { beforeEach, describe, expect, test, vi } from 'vitest'

const users = new Map()
let nextUserId = 1
const query = vi.fn()
const hash = vi.fn()
const verify = vi.fn()

vi.mock('../../api/models/db.js', () => ({ pool: { query } }))
vi.mock('argon2', () => ({ default: { hash, verify } }))

process.env.NODE_ENV = 'test'
process.env.JWT_SECRET = 'test-secret'

const { default: app } = await import('../../api/app.js')

describe('frontend-backend auth flow', () => {
  beforeEach(() => {
    users.clear()
    nextUserId = 1
    vi.clearAllMocks()
    hash.mockImplementation(async (password) => `hashed:${password}`)
    verify.mockImplementation(
      async (passwordHash, password) => passwordHash === `hashed:${password}`,
    )
    query.mockImplementation(async (sql, params = []) => {
      if (sql.includes('SELECT id FROM users WHERE username')) {
        const user = [...users.values()].find(
          (candidate) =>
            candidate.username === params[0] || candidate.email === params[1],
        )
        return { rows: user ? [{ id: user.id }] : [] }
      }

      if (sql.includes('INSERT INTO users')) {
        const user = {
          id: nextUserId++,
          username: params[0],
          email: params[1],
          password_hash: params[2],
        }
        users.set(user.id, user)
        return { rows: [user] }
      }

      if (sql.includes('SELECT * FROM users WHERE email')) {
        const user = [...users.values()].find(
          (candidate) => candidate.email === params[0],
        )
        return { rows: user ? [user] : [] }
      }

      if (sql.includes('SELECT id, username, email FROM users')) {
        const user = users.get(Number(params[0]))
        return {
          rows: user
            ? [{ id: user.id, username: user.username, email: user.email }]
            : [],
        }
      }

      throw new Error(`Unexpected query: ${sql}`)
    })
  })

  test('registers through the frontend API contract', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'alice',
        email: 'alice@example.com',
        password: 'secret',
      })

    expect(response.status).toBe(201)
    expect(response.body).toEqual({ message: 'Rekisteröityminen onnistui!' })
    expect(users.get(1)).toMatchObject({
      username: 'alice',
      email: 'alice@example.com',
      password_hash: 'hashed:secret',
    })
  })

  test('logs in, keeps the auth cookie, and accesses the protected session endpoint', async () => {
    users.set(1, {
      id: 1,
      username: 'alice',
      email: 'alice@example.com',
      password_hash: 'hashed:secret',
    })

    const agent = request.agent(app)
    const loginResponse = await agent
      .post('/api/auth/login')
      .send({ email: 'alice@example.com', password: 'secret' })

    expect(loginResponse.status).toBe(200)
    expect(loginResponse.headers['set-cookie'][0]).toMatch(/auth=/)
    expect(loginResponse.headers['set-cookie'][0]).toMatch(/HttpOnly/)

    const sessionResponse = await agent.get('/api/auth/me')

    expect(sessionResponse.status).toBe(200)
    expect(sessionResponse.body).toEqual({
      user: { id: 1, username: 'alice', email: 'alice@example.com' },
    })
  })

  test('logout removes the cookie and blocks the protected session endpoint', async () => {
    users.set(1, {
      id: 1,
      username: 'alice',
      email: 'alice@example.com',
      password_hash: 'hashed:secret',
    })

    const agent = request.agent(app)
    await agent
      .post('/api/auth/login')
      .send({ email: 'alice@example.com', password: 'secret' })

    const logoutResponse = await agent.post('/api/auth/logout')
    expect(logoutResponse.status).toBe(200)
    expect(logoutResponse.headers['set-cookie'][0]).toMatch(/auth=;/)

    const sessionResponse = await agent.get('/api/auth/me')
    expect(sessionResponse.status).toBe(401)
  })

  test('blocks unauthenticated access to the protected session endpoint', async () => {
    const response = await request(app).get('/api/auth/me')

    expect(response.status).toBe(401)
    expect(response.body).toEqual({ error: 'Kirjautuminen vaaditaan' })
  })
})
