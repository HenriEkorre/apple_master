import { Router } from 'express'
import { getPersonDetails, searchPeople } from '../controllers/peopleController.js'

const router = Router()

router.get('/search', searchPeople)
router.get('/:id', getPersonDetails)

export default router
