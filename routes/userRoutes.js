import express from "express";
import {
  updateUserDetails,
  getUserDetails,
  searchUsers,
  getUserProfile,
} from "../controllers/userDetails.js";
import authMiddleware from "../midleware/authIndex.js";

const router = express.Router();

router.get("/my-profile", authMiddleware, getUserDetails);

router.put("/update-profile", authMiddleware, updateUserDetails);

router.get("/search-users", authMiddleware, searchUsers);

router.get("/profile/:userId", getUserProfile);

export default router;
