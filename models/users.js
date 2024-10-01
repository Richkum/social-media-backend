import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    dateOfBirth: { type: Date },
    gender: { type: String },
    profilePicture: { type: String },
    bio: { type: String },
    emailVerified: { type: Boolean, default: false },
    emailVerificationCode: { type: Number },
    emailVerificationCodeExpiresAt: { type: Date },
    roles: { type: [String], default: ["user"] },
    totalPosts: { type: Number, default: 0 },
    totalLikes: { type: Number, default: 0 },
    totalComments: { type: Number, default: 0 },
    following: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    followers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    sessions: [
      {
        ip: { type: String },
        device: { type: String },
        location: { type: String },
        loggedInAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);
export default User;
