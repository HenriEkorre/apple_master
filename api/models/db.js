import pkg from 'pg'

const { Pool } = pkg

const openDb = () => {
  const useSsl = process.env.DB_SSL === 'true'
 
  return new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: Number(process.env.DB_PORT || 5432),
    ssl: useSsl ? { rejectUnauthorized: true } : false
  })
}

const pool = openDb() 

export { pool }