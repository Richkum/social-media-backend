import mongoose from "mongoose";

const postSchema = new mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    content: { type: String },
    media: [
      {
        type: String,
        required: false,
      },
    ],
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    totalLikes: { type: Number, default: 0 },
    comments: [
      {
        author: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        content: { type: String, required: true },
        replies: [
          {
            author: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
            content: { type: String },
            createdAt: { type: Date, default: Date.now },
          },
        ],
      },
    ],
    totalComments: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const Post = mongoose.model("Post", postSchema);
export default Post;
