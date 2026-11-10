import express from "express";
import { getMyGroups, createGroup } from "../controllers/groupController.js";

const router = express.Router();

// get /api/groups/all
router.post("/all", getMyGroups);

// post /api/groups
router.post("/", createGroup);

export default router;
