import User from "../models/user.model.js";
import Message from "../models/message.model.js";
import cloudinary from "../lib/cloudinary.js";
import { getReceiverSocketId, io } from "../lib/socket.js";
import { detectLanguage, translateText } from "../lib/translate.js";


export const getUsersForSidebar = async (req, res) => {
  try {
    const loggedInUserId = req.user._id;
    const filteredUsers = await User.find({ _id: { $ne: loggedInUserId } }).select("-password");

    res.status(200).json(filteredUsers);
  } catch (error) {
    console.error("Error in getUsersForSidebar: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getMessages = async (req, res) => {
  try {
    const { id: userToChatId } = req.params;
    const myId = req.user._id;

    const messages = await Message.find({
      $or: [
        { senderId: myId, receiverId: userToChatId },
        { senderId: userToChatId, receiverId: myId },
      ],
    });

    res.status(200).json(messages);
  } catch (error) {
    console.log("Error in getMessages controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const sendMessage = async (req, res) => {
    // Validate inputs
    const { text, image } = req.body;
    const { id: receiverId } = req.params;
    const senderId = req.user?._id;

    if (!senderId) {
        return res.status(401).json({ error: "Authentication required" });
    }
    if (!receiverId) {
        return res.status(400).json({ error: "receiverId is required" });
    }
    if (typeof text !== "string" || text.trim() === "") {
        return res
            .status(400)
            .json({ error: "Text must be a non-empty string" });
    }

    // Get receiver's preferred language
    let targetLang = "en";
    try {
        const receiver = await User.findById(receiverId).select(
            "preferredLanguage"
        );
        if (receiver?.preferredLanguage)
            targetLang = receiver.preferredLanguage;
    } catch (err) {
        console.error("Fetching receiver preference failed:", err);
    }

    // Upload image if exists
    let imageUrl = null;
    if (image) {
        try {
            const resUpload = await cloudinary.uploader.upload(image);
            imageUrl = resUpload.secure_url;
        } catch (err) {
            console.error("Cloudinary upload failed:", err);
        }
    }

    // Detect source language
    let sourceLang = "auto";
    try {
        const detected = await detectLanguage(text);
        sourceLang = detected || "auto";
    } catch (err) {
        console.error("Language detection failed:", err);
    }

    // Translate if needed
    let translatedText = text;
    if (sourceLang !== targetLang) {
        try {
            translatedText = await translateText(text, targetLang, sourceLang);
        } catch (err) {
            console.error("Translation failed:", err);
        }
    }

    // Save message with both originalText and translatedText
    let newMessage;
    try {
        newMessage = new Message({
            senderId,
            receiverId,
            originalText: text,
            translatedText,
            detectedLang: sourceLang === "auto" ? null : sourceLang,
            image: imageUrl,
        });
        await newMessage.save();
    } catch (err) {
        console.error("Database save failed:", err);
        return res.status(500).json({ error: "Failed to save message" });
    }

    // Emit via Socket.IO
    try {
        const socketId = getReceiverSocketId(receiverId);
        if (socketId) io.to(socketId).emit("newMessage", newMessage);
    } catch (err) {
        console.error("Socket emit failed:", err);
    }

    return res.status(201).json(newMessage);
};
