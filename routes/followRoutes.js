import express from "express";
import { toggleFollowUser } from "../controllers/follow.js";
import authMiddleware from "../midleware/authIndex.js";

const router = express.Router();

router.post("/:userIdToFollow/follow", authMiddleware, toggleFollowUser);

export default router;
