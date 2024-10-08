import Post from "../models/post.js";
import User from "../models/users.js";
import uploadImageToCloudinary from "../midleware/cloud.js";

// Create a post
// const createPost = async (req, res) => {
//   console.log("Creating new post...");
//   try {
//     const userId = req.user.id; // Extract the user ID from authMiddleware
//     const { text } = req.body;
//     const media = req.files?.media; // Get 'media' from req.files

//     console.log("User ID:", userId);
//     console.log("Post content:", text);
//     console.log("Media:", media);

//     if (!userId) {
//       console.log("User not found, returning 401");
//       return res.status(401).json({ message: "Unauthorized" });
//     }

//     // Check if there is either text or media
//     if (!text && !media) {
//       console.log("Post content or media is required, returning 400");
//       return res
//         .status(400)
//         .json({ message: "Post content or media is required" });
//     }

//     let mediaUrls = [];

//     // Check if media is uploaded and process uploads
//     if (media) {
//       console.log("Media found:", media);

//       // If 'media' is an array of files (multiple media files)
//       if (Array.isArray(media)) {
//         if (media.length > 5) {
//           console.log("Maximum of 5 media files allowed, returning 400");
//           return res.status(400).json({
//             message: "Maximum of 5 media files allowed",
//           });
//         }

//         // Upload each media file to Cloudinary
//         for (const file of media) {
//           console.log("Uploading file:", file.name);
//           const uploadedUrl = await uploadImageToCloudinary(file.tempFilePath); // Use tempFilePath
//           console.log("Uploaded URL:", uploadedUrl);
//           mediaUrls.push(uploadedUrl);
//         }
//       } else {
//         // If 'media' is a single file object
//         console.log("Uploading single file:", media.name);
//         const uploadedUrl = await uploadImageToCloudinary(media.tempFilePath);
//         console.log("Uploaded URL:", uploadedUrl);
//         mediaUrls.push(uploadedUrl);
//       }
//     }

//     // Create a new post
//     const newPost = new Post({
//       author: userId,
//       content: text || "", // Use 'text' here; default to empty string if no text
//       media: mediaUrls, // Save media URLs in the post
//     });

//     console.log("Creating new post:", newPost);

//     await newPost.save();

//     console.log("New post saved:", newPost);

//     return res.status(201).json({
//       message: "Post created successfully",
//       post: newPost,
//     });
//   } catch (error) {
//     console.error("Error creating post:", error);
//     return res.status(500).json({
//       message: "Something went wrong while creating the post",
//     });
//   }
// };

const createPost = async (req, res) => {
  console.log("Creating new post...");
  try {
    const userId = req.user.id; // Extract the user ID from authMiddleware
    const { text } = req.body;
    const media = req.files?.media;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!text && !media) {
      return res
        .status(400)
        .json({ message: "Post content or media is required" });
    }

    let mediaUrls = [];

    if (media) {
      if (Array.isArray(media)) {
        if (media.length > 5) {
          return res
            .status(400)
            .json({ message: "Maximum of 5 media files allowed" });
        }

        for (const file of media) {
          const uploadedUrl = await uploadImageToCloudinary(file.tempFilePath);
          mediaUrls.push(uploadedUrl);
        }
      } else {
        const uploadedUrl = await uploadImageToCloudinary(media.tempFilePath);
        mediaUrls.push(uploadedUrl);
      }
    }

    const newPost = new Post({
      author: userId,
      content: text || "",
      media: mediaUrls,
    });

    await newPost.save();

    // Increment totalPosts in the user's document
    await User.findByIdAndUpdate(userId, { $inc: { totalPosts: 1 } });

    return res.status(201).json({
      message: "Post created successfully",
      post: newPost,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Something went wrong while creating the post",
    });
  }
};

// Get all posts
const getAllPosts = async (req, res) => {
  console.log("Fetching all posts...");
  try {
    const posts = await Post.find()
      .populate("author", "firstName lastName profilePicture") // Populate post author details
      .populate("likes", "firstName lastName profilePicture") // Populate users who liked the post
      .populate({
        path: "comments.author", // Populate comment author details
        select: "firstName lastName profilePicture",
      })
      .populate({
        path: "comments.replies.author", // Populate reply author details
        select: "firstName lastName profilePicture",
      });

    console.log("Posts fetched:", posts);
    return res.status(200).json({
      message: "Posts fetched successfully",
      posts,
    });
  } catch (error) {
    console.error("Error fetching posts:", error);
    return res.status(500).json({
      message: "Something went wrong while fetching posts",
    });
  }
};

// const likePost = async (req, res) => {
//   console.log("Liking post...");
//   const { postId } = req.params;
//   const userId = req.user.id; // Assuming user ID is extracted from the authentication middleware

//   console.log("Finding post by ID", postId);
//   try {
//     // Find the post by ID
//     const post = await Post.findById(postId);
//     if (!post) {
//       console.log("Post not found, returning 404");
//       return res.status(404).json({ message: "Post not found" });
//     }

//     console.log("Checking if user already liked the post");
//     // Check if user already liked the post
//     const liked = post.likes.includes(userId);

//     if (liked) {
//       console.log("User already liked post, removing like");
//       // If already liked, remove the like
//       post.likes.pull(userId);
//       post.totalLikes -= 1;
//     } else {
//       console.log("User hasn't liked post, adding like");
//       // If not liked, add the like
//       post.likes.push(userId);
//       post.totalLikes += 1;
//     }

//     console.log("Saving post...");
//     await post.save();
//     console.log("Post saved");
//     return res.status(200).json({
//       message: liked ? "Like removed" : "Post liked",
//       totalLikes: post.totalLikes,
//     });
//   } catch (error) {
//     console.error("Error liking post:", error);
//     return res.status(500).json({ message: "Something went wrong" });
//   }
// };

const likePost = async (req, res) => {
  console.log("Liking post...");

  const { postId } = req.params;
  const userId = req.user.id;
  console.log("User ID:", userId);
  console.log("Post ID:", postId);

  try {
    console.log(`Fetching post by ID: ${postId}`);
    const post = await Post.findById(postId);
    if (!post) {
      console.log("Post not found, returning 404");
      return res.status(404).json({ message: "Post not found" });
    }

    console.log("Checking if user already liked the post");
    const liked = post.likes.includes(userId);

    if (liked) {
      console.log("User already liked post, removing like");
      post.likes.pull(userId);
      post.totalLikes -= 1;

      console.log("Decrementing total likes in the post author's document");
      await User.findByIdAndUpdate(
        post.author,
        { $inc: { totalLikes: -1 } },
        { new: true }
      );
    } else {
      console.log("User hasn't liked post, adding like");
      post.likes.push(userId);
      post.totalLikes += 1;

      console.log("Incrementing total likes in the post author's document");
      await User.findByIdAndUpdate(
        post.author,
        { $inc: { totalLikes: 1 } },
        { new: true }
      );
    }

    console.log("Saving post...");
    await post.save();
    console.log("Post saved");

    return res.status(200).json({
      message: liked ? "Like removed" : "Post liked",
      totalLikes: post.totalLikes,
    });
  } catch (error) {
    console.error("Error liking post:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

// const commentOnPost = async (req, res) => {
//   console.log("Commenting on post...");
//   const { postId } = req.params;
//   console.log("Post ID:", postId);
//   const userId = req.user.id;
//   console.log("User ID:", userId);
//   const { content } = req.body;
//   console.log("Comment content:", content);

//   if (!content) {
//     console.log("Comment content is required, returning 400");
//     return res.status(400).json({ message: "Comment content is required" });
//   }

//   try {
//     console.log("Finding post by ID...");
//     const post = await Post.findById(postId);
//     if (!post) {
//       console.log("Post not found, returning 404");
//       return res.status(404).json({ message: "Post not found" });
//     }

//     console.log("Adding comment...");
//     // Add the comment
//     const newComment = {
//       author: userId,
//       content,
//     };
//     post.comments.push(newComment);
//     post.totalComments += 1;

//     console.log("Saving post...");
//     await post.save();
//     console.log("Post saved");
//     return res.status(201).json({ message: "Comment added", post });
//   } catch (error) {
//     console.error("Error commenting on post:", error);
//     return res.status(500).json({ message: "Something went wrong" });
//   }
// };

const commentOnPost = async (req, res) => {
  console.log("Commenting on post...");
  const { postId } = req.params;
  console.log("Post ID:", postId);
  const userId = req.user.id; // Ensure req.user is correctly set by your authentication middleware
  console.log("User ID:", userId);
  const { content } = req.body;
  console.log("Comment content:", content);

  if (!content) {
    console.log("Comment content is required, returning 400");
    return res.status(400).json({ message: "Comment content is required" });
  }

  try {
    console.log("Finding post by ID...");
    const post = await Post.findById(postId);
    if (!post) {
      console.log("Post not found, returning 404");
      return res.status(404).json({ message: "Post not found" });
    }

    console.log("Adding comment...");
    const newComment = {
      author: userId,
      content,
    };
    post.comments.push(newComment);
    post.totalComments += 1;

    console.log("Saving post...");
    await post.save();
    console.log("Post saved");

    console.log(
      "Incrementing total comments in the comment author's document..."
    );

    // Check if the user exists before updating
    const user = await User.findById(userId);
    if (!user) {
      console.log("User not found, returning 404");
      return res.status(404).json({ message: "User not found" });
    }

    // Increment total comments for the user
    user.totalComments = (user.totalComments || 0) + 1;
    await user.save();
    console.log("Updated comment author's document");

    return res.status(201).json({ message: "Comment added", post });
  } catch (error) {
    console.error("Error commenting on post:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

const replyToComment = async (req, res) => {
  const { postId, commentId } = req.params;
  const userId = req.user.id;
  const { content } = req.body;

  if (!content) {
    return res.status(400).json({ message: "Reply content is required" });
  }

  try {
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    // Find the comment to reply to
    const comment = post.comments.id(commentId);
    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    // Only the author of the post can reply to comments
    if (post.author.toString() !== userId) {
      return res
        .status(403)
        .json({ message: "You are not authorized to reply to this comment" });
    }

    // Add the reply
    const newReply = {
      author: userId,
      content,
    };
    comment.replies.push(newReply);

    await post.save();
    return res.status(201).json({ message: "Reply added", post });
  } catch (error) {
    console.error("Error replying to comment:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

export { createPost, getAllPosts, likePost, commentOnPost, replyToComment };
