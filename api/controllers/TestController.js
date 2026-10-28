import { getAllTests } from '../models/Test.js'

const getTests = async (req, res, next) => {
  try {
    const result = await getAllTests()
    res.status(200).json(result.rows || [])
  } catch (error) {
    next(error) 
  }
}

export {
  getTests
}