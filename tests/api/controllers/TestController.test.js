import { beforeEach, describe, expect, it, vi } from 'vitest'

// Replace the database model so these tests focus on controller behavior.
vi.mock('../../../api/models/Test.js', () => ({
  getAllTests: vi.fn()
}))

import { getTests } from '../../../api/controllers/TestController.js'
import { getAllTests } from '../../../api/models/Test.js'

describe('getTests', () => {
  beforeEach(() => {
    // Clear the previous test's mock implementation and call history.
    getAllTests.mockReset()
  })

  it('returns the rows from the model with status 200', async () => {
    const rows = [{ id: 1, description: 'Example test' }]
    // Stand-ins for Express response methods; mockReturnThis() allows res.status().json().
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn()
    }

    // Make the model resolve as if the database query succeeded.
    getAllTests.mockResolvedValue({ rows })

    // Call the controller directly with mock request, response, and next arguments.
    await getTests({}, res, vi.fn())

    // The controller should call the model and send its rows as JSON with HTTP 200.
    expect(getAllTests).toHaveBeenCalledOnce()
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith(rows)
  })

  it('passes model errors to the next middleware', async () => {
    const error = new Error('Database query failed')
    const next = vi.fn()
    // Make the model reject to simulate a database failure.
    getAllTests.mockRejectedValue(error)

    // Express controllers pass errors to next() for centralized error handling.
    await getTests({}, {}, next)

    expect(next).toHaveBeenCalledWith(error)
  })
})
