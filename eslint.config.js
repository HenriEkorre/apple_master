import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'
import stylistic from '@stylistic/eslint-plugin'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs['recommended-latest'],
      reactRefresh.configs.vite
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: {
        ...globals.browser,
        ...globals.node
      },
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module'
      }
    },
    plugins: {
      '@stylistic': stylistic
    },
    rules: {
      // Disallow unused variables; names starting with an uppercase letter or _ (and _-prefixed arguments) are ignored
      'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]', argsIgnorePattern: '^_' }],
      // Always use === and !== instead of == and !=
      eqeqeq: ['error', 'always'],
      // Use let/const instead of var
      'no-var': 'error',
      // Use const for variables that are never reassigned
      'prefer-const': 'error',
      // Warn when a function's cyclomatic complexity exceeds 5
      complexity: ['warn', 5],
      // Warn when blocks are nested deeper than 3 levels
      'max-depth': ['warn', 3],
      // Warn when a function is longer than 50 lines (blank lines and comments not counted)
      'max-lines-per-function': ['warn', {
        max: 50,
        skipBlankLines: true,
        skipComments: true
      }],
      // Indent with 2 spaces; case clauses are indented one level inside switch
      '@stylistic/indent': ['error', 2, {
        SwitchCase: 1
      }],
      // Use single quotes; template literals are still allowed
      '@stylistic/quotes': ['error', 'single', {
        allowTemplateLiterals: 'always'
      }],
      // Do not use semicolons at the end of statements
      '@stylistic/semi': ['error', 'never'],
    }
  }
])
