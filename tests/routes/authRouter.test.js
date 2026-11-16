import express from 'express'
import request from 'supertest'
import jwt from 'jsonwebtoken'
import { beforeEach, describe, expect, test, vi } from 'vitest'

const query = vi.fn()
const registerUser = vi.fn((req, res) => res.status(201).json({ message: 'registered' }))
const loginUser = vi.fn((req, res) => {
  res.cookie('auth', 'test-token', {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 30 * 60 * 1000,
  })
  res.json({ user: { id: 1, email: req.body.email } })
})

vi.mock('../../api/controllers/authController.js', () => ({
  registerUser,
  loginUser,
}))
vi.mock('../../api/models/db.js', () => ({ pool: { query } }))

const { default: authRouter } = await import('../../api/routes/authRouter.js')

const app = express()
app.use(express.json())
app.use((await import('cookie-parser')).default())
app.use('/api/auth', authRouter)

describe('authRouter', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.JWT_SECRET = 'test-secret'
  })

  test('POST /api/auth/register reaches the register controller', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({ username: 'alice', email: 'alice@example.com', password: 'secret' })

    expect(response.status).toBe(201)
    expect(response.body).toEqual({ message: 'registered' })
    expect(registerUser).toHaveBeenCalled()
  })

  test('POST /api/auth/login reaches the login controller and sets a cookie', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: 'alice@example.com', password: 'secret' })

    expect(response.status).toBe(200)
    expect(loginUser).toHaveBeenCalled()
    expect(response.headers['set-cookie'][0]).toMatch(/auth=test-token/)
    expect(response.headers['set-cookie'][0]).toMatch(/HttpOnly/)
    expect(response.headers['set-cookie'][0]).toMatch(/SameSite=Lax/)
  })

  test('GET /api/auth/me rejects a missing cookie', async () => {
    const response = await request(app).get('/api/auth/me')

    expect(response.status).toBe(401)
    expect(response.body).toEqual({ error: 'Kirjautuminen vaaditaan' })
  })

  test('GET /api/auth/me accepts a valid cookie', async () => {
    const token = jwt.sign({ sub: 1 }, 'test-secret', {
      algorithm: 'HS256',
      issuer: 'apple-master',
      audience: 'apple-master-web',
    })
    query.mockResolvedValueOnce({
      rows: [{ id: 1, username: 'alice', email: 'alice@example.com' }],
    })

    const response = await request(app)
      .get('/api/auth/me')
      .set('Cookie', `auth=${token}`)

    expect(response.status).toBe(200)
    expect(response.body).toEqual({
      user: { id: 1, username: 'alice', email: 'alice@example.com' },
    })
  })

  test('GET /api/auth/me rejects an invalid cookie', async () => {
    const response = await request(app)
      .get('/api/auth/me')
      .set('Cookie', 'auth=invalid-token')

    expect(response.status).toBe(401)
    expect(response.body).toEqual({ error: 'Istunto ei ole voimassa' })
  })

  test('POST /api/auth/logout clears the auth cookie', async () => {
    const response = await request(app).post('/api/auth/logout')

    expect(response.status).toBe(200)
    expect(response.body).toEqual({ message: 'Kirjauduttu ulos' })
    expect(response.headers['set-cookie'][0]).toMatch(/auth=;/)
    expect(response.headers['set-cookie'][0]).toMatch(/HttpOnly/)
    expect(response.headers['set-cookie'][0]).toMatch(/SameSite=Lax/)
  })
})
