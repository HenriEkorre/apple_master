import express from "express";
import { getMyGroups, createGroup } from "../controllers/groupController.js";
import { protect } from '../middleware/authMiddleware.js'

const router = express.Router();

// get /api/groups/all
router.post("/all",protect, getMyGroups);

// post /api/groups
router.post("/", protect, createGroup);

export default router;
