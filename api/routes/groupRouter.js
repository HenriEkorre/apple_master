import express from "express";
import { getMyGroups } from "../controllers/groupController.js";

const router = express.Router();

// get /api/groups/all
router.post("/all", getMyGroups);

export default router;
