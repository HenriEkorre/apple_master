import express from 'express'
import request from 'supertest'
import { describe, expect, it, vi } from 'vitest'

// Stub the model so this route test does not need a running database.
vi.mock('../../../api/models/Test.js', () => ({
  getAllTests: vi.fn()
}))

import { getAllTests } from '../../../api/models/Test.js'
import testRouter from '../../../api/routes/testRouter.js'

// Mount the real router on a small Express app for Supertest.
const app = express()
app.use('/api/tests', testRouter)

describe('GET /api/tests', () => {
  it('returns the tests from the database', async () => {
    const tests = [{ id: 1, description: 'Example test' }]
    // Simulate the model returning rows from its database query.
    getAllTests.mockResolvedValue({ rows: tests })

    // Send an HTTP request through Express, the real router, and the controller.
    const response = await request(app)
      .get('/api/tests')
      .expect(200)
      .expect('Content-Type', /json/)

    // Confirm the endpoint returns exactly the rows provided by the model.
    expect(response.body).toEqual(tests)
  })
})
