import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
    {
        email: {
            type: String,
            required: true,
            unique: true,
        },
        fullName: {
            type: String,
            required: true,
        },
        password: {
            type: String,
            required: true,
            minlength: 6,
        },
        profilePic: {
            type: String,
            default: "",
        },
        preferredLanguage: {
            type: String,
            required: true,
            enum: ["en", "hi", "fr" /* etc */],
            default: "en",
        },
    },
    { timestamps: true }
);

const User = mongoose.model("User", userSchema);

export default User;