import argon2 from 'argon2'
import {
  createUser,
  findUserByCredentials,
  findUserByEmail,
} from '../repositories/authRepository.js'

export const registerAccount = async ({ username, email, password }) => {
  try {
    const existingUsers = await findUserByCredentials(username, email)
    if (existingUsers.length > 0) {
      const error = new Error('Käyttäjänimi tai sähköposti on jo varattu')
      error.status = 400
      error.code = 'AUTH_CREDENTIALS_TAKEN'
      throw error
    }

    const passwordHash = await argon2.hash(password)
    await createUser(username, email, passwordHash)
  } catch (error) {
    if (
      error.code === '23505' ||
      error.code?.startsWith('SQLITE_CONSTRAINT')
    ) {
      const conflict = new Error(
        'Sähköposti tai käyttäjänimi on jo käytössä',
      )
      conflict.status = 409
      conflict.code = 'AUTH_CREDENTIALS_CONFLICT'
      throw conflict
    }
    throw error
  }
}

export const authenticateAccount = async (email, password) => {
  const user = await findUserByEmail(email)
  if (!user) return null

  const isMatch = await argon2.verify(user.password_hash, password)
  return isMatch ? user : null
}
