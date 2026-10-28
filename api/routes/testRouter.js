import { Router } from 'express'
import { getTests } from '../controllers/TestController.js'

const router = Router()

router.get('/', getTests)

export default router