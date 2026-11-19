import { beforeEach, describe, expect, test, vi } from 'vitest'

const { queryMock } = vi.hoisted(() => ({
  queryMock: vi.fn(),
}))

vi.mock('../../api/models/db.js', () => ({
  pool: { query: queryMock },
}))

const {
  getMyReviews,
  createReview,
} = await import('../../api/controllers/reviewController.js')
const {
  getMyComments,
  createComment,
} = await import('../../api/controllers/commentController.js')
const {
  getMyHistory,
  addToHistory,
} = await import('../../api/controllers/historyController.js')

const createResponse = () => ({
  status: vi.fn().mockReturnThis(),
  json: vi.fn(),
})

describe('review, comment and history controllers', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('review creation requires a movie id and rating', async () => {
    const response = createResponse()

    await createReview(
      { user: { id: 1 }, body: { comment: 'Good' } },
      response,
      vi.fn(),
    )

    expect(response.status).toHaveBeenCalledWith(400)
    expect(queryMock).not.toHaveBeenCalled()
  })

  test('comment creation requires a movie id and content', async () => {
    const response = createResponse()

    await createComment(
      { user: { id: 1 }, body: { movieId: 550 } },
      response,
      vi.fn(),
    )

    expect(response.status).toHaveBeenCalledWith(400)
    expect(queryMock).not.toHaveBeenCalled()
  })

  test('history creation requires a movie id', async () => {
    const response = createResponse()

    await addToHistory(
      { user: { id: 1 }, body: {} },
      response,
      vi.fn(),
    )

    expect(response.status).toHaveBeenCalledWith(400)
    expect(queryMock).not.toHaveBeenCalled()
  })

  test.each([
    ['reviews', getMyReviews],
    ['comments', getMyComments],
    ['history', getMyHistory],
  ])('%s queries are scoped to the authenticated user', async (_name, handler) => {
    const response = createResponse()
    const next = vi.fn()
    queryMock.mockResolvedValueOnce({ rows: [{ id: 1 }] })

    await handler({ user: { id: 1 } }, response, next)

    expect(response.status).toHaveBeenCalledWith(200)
    expect(queryMock).toHaveBeenCalledWith(
      expect.stringContaining('WHERE user_id = $1'),
      [1],
    )
    expect(next).not.toHaveBeenCalled()
  })
})
