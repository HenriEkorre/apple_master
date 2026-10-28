import request from 'supertest'
import { afterAll, describe, expect, it } from 'vitest'
import app from '../../../api/app.js'
import { pool } from '../../../api/models/db.js'

describe('GET /api/tests (database integration)', () => {
  // Close PostgreSQL connections so Vitest can exit after the suite finishes.
  afterAll(async () => {
    await pool.end()
  })

  it('returns records from the test table', async () => {
    // Unlike the unit test, this uses the real app, model, and configured database.
    const response = await request(app)
      .get('/api/tests')
      .expect(200)
      .expect('Content-Type', /json/)

    // Ensure the endpoint returned at least one row with the table's expected columns.
    expect(response.body.length).toBeGreaterThan(0)
    expect(response.body[0]).toEqual({
      id: expect.any(Number),
      description: expect.any(String)
    })
  })
})
