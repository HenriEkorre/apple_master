import { issueCookie } from '../middleware/authMiddleware.js'
import {
  authenticateAccount,
  registerAccount,
} from '../services/authService.js'

// 1. REKISTERÖITYMINEN
export const registerUser = async (req, res, next) => {
  try {
    const { username, email, password } = req.body

    // Tarkistetaan, että kaikki vaaditut kentät on annettu
    if (!username || !email || !password) {
      return res.status(400).json({
        error: 'Kaikki kentät (username, email, password) ovat pakollisia',
      })
    }

    try {
      await registerAccount({ username, email, password })
    } catch (error) {
      if (error.code === 'AUTH_CREDENTIALS_TAKEN') {
        return res
          .status(400)
          .json({ error: error.message })
      }
      if (error.code === 'AUTH_CREDENTIALS_CONFLICT') {
        return res
          .status(409)
          .json({ error: error.message })
      }
      throw error
    }

    res.status(201).json({
      message: 'Rekisteröityminen onnistui!',
    })
  } catch (error) {
    next(error)
  }
}

// 2. KIRJAUTUMINEN
export const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res
        .status(400)
        .json({ error: 'Sähköposti ja salasana vaaditaan' })
    }

    const user = await authenticateAccount(email, password)
    if (!user) {
      return res
        .status(401)
        .json({ error: 'Virheellinen sähköposti tai salasana' })
    }

    issueCookie(res, user)
    res.json({
      user: { id: user.id, username: user.username, email: user.email },
    })
  } catch (error) {
    next(error)
  }
}
