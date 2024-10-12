import User from "../models/users.js"; // Assuming the model is in models/User.js
import { io } from "../server.js"; // Importing socket instance if it's in index.js

// Combined function to follow or unfollow a user
const toggleFollowUser = async (req, res) => {
  console.log("toggleFollowUser called");
  try {
    const userIdToToggle = req.params.userIdToFollow; // ID of the user to follow/unfollow
    console.log(req.params);

    console.log("userIdToToggle", userIdToToggle);

    const userId = req.user.id;

    console.log("userId", userId);

    if (
      !userId ||
      !userIdToToggle ||
      userIdToToggle === "undefined" ||
      userId === "undefined"
    ) {
      console.log("Both user IDs are required");
      return res.status(400).json({ message: "User ID is required" });
    }

    // Check if the user is trying to follow themselves
    if (userId === userIdToToggle) {
      console.log("Cannot follow self");
      return res.status(400).json({ message: "You cannot follow yourself." });
    }

    // Fetch both users
    const user = await User.findById(userId);
    const userToToggle = await User.findById(userIdToToggle);

    // Check if already following
    const isFollowing = user.following.includes(userIdToToggle);

    if (isFollowing) {
      // If already following, unfollow
      console.log("Unfollowing user");
      user.following = user.following.filter(
        (id) => id.toString() !== userIdToToggle
      );
      userToToggle.followers = userToToggle.followers.filter(
        (id) => id.toString() !== userId
      );

      // Emit real-time event via Socket.IO to notify both users
      io.to(userIdToToggle).emit("unfollow", { follower: userId });
      io.to(userId).emit("unfollowUpdate", { unfollowing: userIdToToggle });

      await user.save();
      await userToToggle.save();

      res.status(200).json({ message: "User unfollowed successfully." });
    } else {
      // If not following, follow
      console.log("Following user");
      user.following.push(userIdToToggle);
      userToToggle.followers.push(userId);

      // Emit real-time event via Socket.IO to notify both users
      io.to(userIdToToggle).emit("follow", { follower: userId });
      io.to(userId).emit("followUpdate", { following: userIdToToggle });

      await user.save();
      await userToToggle.save();

      res.status(200).json({ message: "User followed successfully." });
    }
  } catch (error) {
    console.error("Error toggling follow:", error);
    res.status(500).json({ message: error.message });
  }
};

const getFriends = async (req, res) => {
  console.log("getFriends called");
  try {
    const userId = req.user.id;
    console.log("userId", userId);

    // Find the user and populate their following and followers
    const user = await User.findById(userId)
      .populate("following", "_id firstName lastName profilePicture")
      .populate("followers", "_id firstName lastName profilePicture")
      .exec();

    if (!user) {
      console.log("User not found, returning 404");
      return res.status(404).json({ message: "User not found" });
    }

    // Find mutual followers (people who follow each other)
    const friends = user.following.filter((followingUser) =>
      user.followers.some(
        (followerUser) =>
          followerUser._id.toString() === followingUser._id.toString()
      )
    );
    console.log("friends", friends);

    return res.status(200).json(friends);
  } catch (err) {
    console.error("Error getting friends:", err);
    return res
      .status(500)
      .json({ message: "Server error", error: err.message });
  }
};

export { toggleFollowUser, getFriends };
