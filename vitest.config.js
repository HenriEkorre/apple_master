import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      thresholds: {
        statements: 52,
        branches: 37,
        functions: 53,
        lines: 52,
      },
    },
  },
})
