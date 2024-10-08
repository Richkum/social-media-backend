import User from "../models/users.js";
import Post from "../models/post.js";
import mongoose from "mongoose";
import uploadImageToCloudinary from "../midleware/cloud.js";

const updateUserDetails = async (req, res) => {
  console.log("Updating user details");

  try {
    const { firstName, lastName, bio } = req.body;
    console.log("req.body", req.body);
    const userId = req.user.id;

    console.log("Finding user with id", userId);

    if (!userId) {
      console.log("User not found, returning 404");
      return res.status(404).json({ message: "User not found" });
    }

    console.log("Getting data from request body");

    if (!firstName && !lastName && !bio && !req.files?.profilePicture) {
      console.log("Nothing to update, returning 400");
      return res.status(400).json({ message: "Nothing to update" });
    }

    const updateData = {};

    console.log("Preparing data to update");

    if (firstName) {
      console.log("Updating first name");
      updateData.firstName = firstName;
    }
    if (lastName) {
      console.log("Updating last name");
      updateData.lastName = lastName;
    }
    if (bio) {
      console.log("Updating bio");
      updateData.bio = bio;
    }

    console.log("Checking if file is present");

    if (req.files?.profilePicture) {
      console.log("File is present, updating profile picture");
      const profilePicture = req.files.profilePicture.tempFilePath;

      console.log("Uploading image to cloudinary");
      const profilePictureUrl = await uploadImageToCloudinary(profilePicture);
      updateData.profilePicture = profilePictureUrl;
    }

    console.log("Updating user");

    const updateUser = await User.findByIdAndUpdate(req.user._id, updateData, {
      new: true,
    });

    // if (!updateUser) {
    //   console.log("User not found, returning 404");
    //   return res.status(404).json({ message: "User not found" });
    // }

    console.log("User updated successfully, returning 200");
    res
      .status(200)
      .json({ message: "User updated successfully", user: updateUser });
  } catch (error) {
    console.error("Error updating user", error);
    res.status(500).json({ message: error.message });
  }
};
const getUserDetails = async (req, res) => {
  console.log("Getting user details");

  try {
    const userId = req.user.id;

    console.log("Finding user with id", userId);

    const user = await User.findById(userId).select(
      "-password -emailVerificationCode -emailVerificationCodeExpiresAt"
    );

    if (!user) {
      console.log("User not found, returning 404");
      return res.status(404).json({ message: "User not found" });
    }

    console.log("User found, returning 200");

    res
      .status(200)
      .json({ message: "User details fetched successfully", user });
  } catch (error) {
    console.error("Error getting user details", error);
    res.status(500).json({ message: "An error occurred", error });
  }
};

const searchUsers = async (req, res) => {
  try {
    const { query } = req.params;
    if (!query) {
      return res.status(400).json({ message: "Search query is required" });
    }

    // Regular expression for partial and case-insensitive match
    const regex = new RegExp(query, "i");

    const users = await User.find({
      $or: [
        { firstName: { $regex: regex } },
        { lastName: { $regex: regex } },
        {
          $expr: {
            $regexMatch: {
              input: { $concat: ["$firstName", " ", "$lastName"] },
              regex,
            },
          },
        },
      ],
    }).select("firstName lastName profilePicture"); // Select fields to return

    if (users.length === 0) {
      return res.status(404).json({ message: "No users found" });
    }

    return res.status(200).json({ users });
  } catch (error) {
    console.error("Error searching users:", error);
    return res.status(500).json({ message: "Error searching users" });
  }
};

const getUserProfile = async (req, res) => {
  console.log("getUserProfile called");
  try {
    console.log("Getting user ID from request params");
    const { userId } = req.params;
    console.log(`User ID: ${userId}`);

    // Check if userId is valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      console.log("Invalid User ID format");
      return res.status(400).json({ message: "Invalid User ID format" });
    }

    if (!userId || userId === "undefined") {
      console.log("User ID is required");
      return res.status(400).json({ message: "User ID is required" });
    }

    console.log("Fetching user details");
    // Fetch user details
    const user = await User.findById(userId)
      .select("-password -emailVerificationCode")
      .populate("followers", "firstName lastName profilePicture")
      .populate("following", "firstName lastName profilePicture");
    console.log("User details:", user);

    if (!user) {
      console.log("User not found");
      return res.status(404).json({ message: "User not found" });
    }

    console.log("Fetching all posts by this user");
    const posts = await Post.find({ author: userId })
      .populate("author", "firstName lastName profilePicture")
      .sort({ createdAt: -1 });
    console.log("Posts:", posts);

    console.log("Combining user details and posts into a single response");
    res.status(200).json({
      user: {
        firstName: user.firstName,
        lastName: user.lastName,
        profilePicture: user.profilePicture,
        bio: user.bio,
        followers: user.followers.length,
        following: user.following.length,
        totalPosts: user.totalPosts,
        totalLikes: user.totalLikes,
        totalComments: user.totalComments,
        joinedDate: user.createdAt,
        followersList: user.followers,
        followingList: user.following,
      },
      posts, // Include user's posts in the response
    });
  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({ message: "Server error", error });
  }
};

export { updateUserDetails, getUserDetails, searchUsers, getUserProfile };
