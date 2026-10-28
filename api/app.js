import 'dotenv/config'
import express from 'express'
import path from 'path'
import { fileURLToPath } from 'url'
import cors from 'cors'
import errorHandler from './middleware/errorHandler.js'
import testRouter from './routes/testRouter.js'

const app = express()

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const frontendDist = path.join(__dirname, '..', 'dist')

app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: false }))

app.use('/api/tests', testRouter)

// Health check endpoint for database connectivity
app.get('/api/health', async (req, res) => {
  try {
    const { pool } = await import('./models/db.js')
    await pool.query('SELECT 1')
    res.status(200).json({
      status: 'healthy',
      database: 'connected',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      database: 'disconnected',
      error: error.message,
      timestamp: new Date().toISOString()
    })
  }
})

app.use('/api', (req, res, next) => {
  const error = new Error('Not found')
  error.status = 404
  next(error)
})

app.use(express.static(frontendDist))

app.get(/.*/, (req, res) => {
  res.sendFile(path.join(frontendDist, 'index.html'))
})

app.use(errorHandler)

export default app
