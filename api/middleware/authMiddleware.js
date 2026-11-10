import jwt from 'jsonwebtoken'

export const protect = (req, res, next) => {
  let token

  // Tarkistetaan, että Authorization-otsikko löytyy ja se alkaa "Bearer"
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Otetaan pelkkä token-merkkijono talteen
      token = req.headers.authorization.split(' ')[1]

      // Puretaan token ja tarkistetaan sen voimassaolo
      const decoded = jwt.verify(token, process.env.JWT_SECRET)

      // Tallennetaan käyttäjän ID request-olioon, jotta kontrollerit voivat käyttää sitä
      req.user = { id: decoded.id }

      next() // Siirrytään eteenpäin varsinaiselle kontrollerille
    } catch (error) {
      return res.status(401).json({ error: 'Ei käyttöoikeutta, token virheellinen tai vanhentunut' })
    }
  }

  if (!token) {
    return res.status(401).json({ error: 'Ei käyttöoikeutta, token puuttuu' })
  }
}