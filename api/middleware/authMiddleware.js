import jwt from 'jsonwebtoken'
import { pool } from '../models/db.js'
export const cookieName = 'auth'
export const cookieOptions = {
  httpOnly: true, // httpOnly tarkoittaa, että eväste ei ole käytettävissä JavaScriptistä
  secure: process.env.NODE_ENV === 'production', // secure tarkoittaa, että eväste lähetetään vain HTTPS-yhteyden yli, tämä on ehdollinen vain tuotannossa
  sameSite: 'lax', // lax tarkoittaa, että eväste lähetetään vain saman originin pyyntöihin, mutta ei cross-site POST-pyyntöihin
  path: '/', // polku tarkoittaa, että eväste on voimassa kaikilla poluilla
}

export const protect = async (req, res, next) => {
  try {
    const token = req.cookies?.[cookieName]

    // Jos eväste puuttuu, palautetaan 401 Unauthorized
    if (!token)
      return res.status(401).json({ error: 'Kirjautuminen vaaditaan' })

    // Luetaan JWT ja tarkistetaan sen voimassaolo.
    // Jos JWT on voimassa, se palauttaa payloadin, joka sisältää käyttäjän id:n (sub).
    const payload = jwt.verify(token, process.env.JWT_SECRET, {
      algorithms: ['HS256'],
      issuer: 'apple-master',
      audience: 'apple-master-web',
    })

    // Haetaan käyttäjän tiedot tietokannasta käyttäjän id:n perusteella.
    const result = await pool.query(
      'SELECT id, username, email FROM users WHERE id = $1',
      [payload.sub],
    )
    const user = result.rows[0]

    // Jos käyttäjää ei löydy, palautetaan 401 Unauthorized
    if (!user) return res.status(401).json({ error: 'Käyttäjää ei löydy' })

    // Jos kaikki on kunnossa, lisätään käyttäjän tiedot pyyntöön ja jatketaan seuraavaan middlewareen tai reittiin.
    // Käyttäjän tiedot löytyvät req.user-objektista, jota voidaan käyttää seuraavissa reiteissä.
    req.user = user
    next()
  } catch {
    return res.status(401).json({ error: 'Istunto ei ole voimassa' })
  }
}

export function issueCookie(res, user) {
  // Luodaan JWT ja käytetään ympäristömuuttujassa olevaa salaisuutta (JWT_SECRET) allekirjoittamiseen.
  // JWT sisältää käyttäjän id:n (sub) ja on voimassa 30 minuuttia.
  // Lisäksi määritellään algoritmi, julkaisija (issuer) ja vastaanottaja (audience) (nämä eivät ole pakollisia).
  const token = jwt.sign({ sub: user.id }, process.env.JWT_SECRET, {
    expiresIn: '30m',
    algorithm: 'HS256',
    issuer: 'apple-master',
    audience: 'apple-master-web',
  })
  // Asetetaan eväste vastaukseen
  res.cookie(cookieName, token, { ...cookieOptions, maxAge: 30 * 60 * 1000 })
}
