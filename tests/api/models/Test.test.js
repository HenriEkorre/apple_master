import { beforeEach, describe, expect, it, vi } from 'vitest'

// Vitest hoists vi.mock() before imports, so hoisted() makes the query mock
// available to the mock factory before the test module is evaluated.
const { query } = vi.hoisted(() => ({
  query: vi.fn()
}))

// Replace the real PostgreSQL pool so this unit test never connects to a database.
vi.mock('../../../api/models/db.js', () => ({
  pool: { query }
}))

// Import the model after declaring the database mock.
import { getAllTests } from '../../../api/models/Test.js'

describe('getAllTests', () => {
  beforeEach(() => {
    // Keep call history and configured responses isolated between tests.
    query.mockReset()
  })

  it('queries the test table and returns the database result', async () => {
    const result = { rows: [{ id: 1, description: 'Example test' }] }
    // Simulate the shape returned by pg's pool.query().
    query.mockResolvedValue(result)

    // Verify both the SQL issued by the model and the result it passes back.
    await expect(getAllTests()).resolves.toBe(result)
    expect(query).toHaveBeenCalledWith('SELECT * FROM test')
  })
})
