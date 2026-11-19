import { vi } from 'vitest'

export const createMockResponse = (methods = {}) => ({
  status: vi.fn().mockReturnThis(),
  json: vi.fn().mockReturnThis(),
  cookie: vi.fn().mockReturnThis(),
  clearCookie: vi.fn().mockReturnThis(),
  ...methods,
})
