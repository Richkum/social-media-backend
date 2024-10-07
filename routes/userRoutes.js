import express from "express";
import {
  updateUserDetails,
  getUserDetails,
} from "../controllers/userDetails.js";
import authMiddleware from "../midleware/authIndex.js";

const router = express.Router();

router.get("/my-profile", authMiddleware, getUserDetails);

router.put("/update-profile", authMiddleware, updateUserDetails);

export default router;
