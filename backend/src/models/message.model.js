import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
    {
        senderId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        receiverId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        originalText: { type: String, default: null }, // the raw text user sent
        translatedText: { type: String, required: true }, // always populated
        detectedLang: { type: String, required: true }, // e.g. "en", "hi", "fr"
        image: { type: String, default: null },
    },
    { timestamps: true }
);

export default mongoose.model("Message", messageSchema);