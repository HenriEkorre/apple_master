import 'dotenv/config'
import express from 'express'
import path from 'path'
import { fileURLToPath } from 'url'
import errorHandler from './middleware/errorHandler.js'
import movieRouter from './routes/movieRouter.js'
import authRouter from './routes/authRouter.js'
import groupRouter from './routes/groupRouter.js'
import cookieParser from 'cookie-parser'
const app = express()

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const frontendDist = path.join(__dirname, '..', 'dist')
const configuredOrigin = process.env.APP_ORIGIN || 'http://127.0.0.1:5173'
const isProduction = process.env.NODE_ENV === 'production'

if (isProduction && !configuredOrigin.startsWith('https://')) {
  throw new Error('APP_ORIGIN must use HTTPS in production')
}

if (isProduction) {
  app.set('trust proxy', 1)
  app.use((req, res, next) => {
    if (req.secure) return next()

    return res.redirect(308, `https://${req.get('host')}${req.originalUrl}`)
  })
}

const allowedOrigins =
  isProduction
    ? [configuredOrigin]
    : [configuredOrigin, 'http://localhost:5173', 'http://127.0.0.1:5173']

app.use((req, res, next) => {
  // Tarkista onko kyseessä tilaa muuttava pyyntö (POST, PUT, PATCH, DELETE)
  if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) return next()

  const origin = req.get('origin')
  console.log('Origin:', origin)

  // Tarkista, että origin on oikea.
  if (origin && !allowedOrigins.includes(origin))
    return res.status(403).json({ error: 'Virheellinen Origin' })

  // Tarkista, että origin on annettu pyynnössä.
  if (!origin && isProduction)
    return res.status(403).json({ error: 'Origin puuttuu' })

  next()
})

app.use(express.json())
app.use(express.urlencoded({ extended: false }))
app.use(cookieParser())

app.use('/api/movies', movieRouter)
app.use('/api/auth', authRouter)
app.use('/api/groups', groupRouter)

// Health check endpoint for database connectivity
app.get('/api/health', async (req, res) => {
  try {
    const { pool } = await import('./models/db.js')
    await pool.query('SELECT 1')
    res.status(200).json({
      status: 'healthy',
      database: 'connected',
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      database: 'disconnected',
      error: error.message,
      timestamp: new Date().toISOString(),
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
