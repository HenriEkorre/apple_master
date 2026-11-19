import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      thresholds: {
        statements: 55,
        branches: 38,
        functions: 59,
        lines: 54,
      },
    },
  },
})
