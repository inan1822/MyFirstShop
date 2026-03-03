import mongoose from "mongoose"

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true

    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    sendVerificationCode: String,
    isVerified: { type: Boolean, required: false },

    password: {
        type: String,
        required: true
    }
}, { timestamps: true })

const userModel = mongoose.model("user", userSchema)

export default userModel