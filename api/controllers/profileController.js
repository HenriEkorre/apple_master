import {
  findActiveGroupsByUserId,
  findProfileUserById,
} from '../repositories/profileRepository.js'

export const getProfile = async (req, res, next) => {
  try {
    const userId = req.params.id
    if (!userId || isNaN(userId)) {
      return res.status(200).json([])
    }

    const user = await findProfileUserById(userId)
    const groups = await findActiveGroupsByUserId(userId)

    const groupsWithLinks = groups.map((group) => ({
      ...group,
      name: group.name,
      link: `/groups/${group.id}`,
      type: group.type,
    }))

    const result = {
      user,
      groups: groupsWithLinks,
    }

    res.status(200).json(result)
  } catch (error) {
    next(error)
  }
}
