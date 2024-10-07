import express from "express";
import {
  createPost,
  getAllPosts,
  likePost,
  commentOnPost,
  replyToComment,
} from "../controllers/postControllers.js";
import authMiddleware from "../midleware/authIndex.js";

const router = express.Router();

router.post("/create-post", authMiddleware, createPost);

router.get("/all-posts", getAllPosts);

router.post("/:postId/like", authMiddleware, likePost);

router.post("/:postId/comment", authMiddleware, commentOnPost);

router.post("/:postId/:commentId/reply", authMiddleware, replyToComment);

export default router;
