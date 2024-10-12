import Message from "../models/message";

const sendMessage = async (req, res) => {
  try {
    const { senderId, recipientId, content } = req.body;

    // Create a new message
    const message = new Message({
      sender: senderId,
      recipient: recipientId,
      content,
    });

    await message.save();

    return res
      .status(201)
      .json({ message: "Message sent successfully", data: message });
  } catch (err) {
    return res
      .status(500)
      .json({ message: "Server error", error: err.message });
  }
};

const getMessages = async (req, res) => {
  try {
    const { userId1, userId2 } = req.params;

    // Find messages between two users (either sender or recipient)
    const messages = await Message.find({
      $or: [
        { sender: userId1, recipient: userId2 },
        { sender: userId2, recipient: userId1 },
      ],
    }).sort({ createdAt: 1 });

    return res.status(200).json(messages);
  } catch (err) {
    return res
      .status(500)
      .json({ message: "Server error", error: err.message });
  }
};

export { sendMessage, getMessages };
