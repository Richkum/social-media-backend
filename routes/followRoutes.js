import express from "express";
import { toggleFollowUser, getFriends } from "../controllers/follow.js";
import authMiddleware from "../midleware/authIndex.js";

const router = express.Router();

router.post("/:userIdToFollow/follow", authMiddleware, toggleFollowUser);

router.get("/:userId/friends", authMiddleware, getFriends);

export default router;
