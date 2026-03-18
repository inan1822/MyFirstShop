import mongoose from "mongoose"
import bcrypt from "bcrypt"


const orderItemSchema = new mongoose.Schema({
    ObjectId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
        required: true
    },
    quantity: {
        type: Number,
        required: true,
        min: 1,
        default: 1
    }
})



const addressSchema = new mongoose.Schema({
    street: { type: String, required: true },
    city: { type: String, required: true },
    country: { type: String, required: true },
    zipCode: { type: String, required: true }
})



const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        minlength: 2
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true
    },
    sendVerificationCode: String,
    isVerified: {
        type: Boolean,
        default: false
    },
    sendVerificationCodeExpiry: Date,

    password: {
        type: String,
        required: true,
        validate: {
            validator: function (value) {
                // Only validate raw password (not hashed)
                return value.length >= 8
            },
            message: "Password must be at least 8 characters long"
        }
    },
    twoFactorCode: String,
    twoFactorExpiry: Date,
    resetPasswordToken: String,
    resetPasswordExpiry: Date,

    role: {
        type: String,
        enum: ["customer", "admin"],
        default: "customer"
    },

    addresses: {
        type: [addressSchema],
        default: []
    },

    cart: {
        type: [cartItemSchema],
        default: []
    }

}, { timestamps: true })



orderItemSchema.pre("save", async function () {
    if (!this.isModified("password")) return
    this.password = await bcrypt.hash(this.password, 10)
})

const userModel = mongoose.model("order", orderItemSchema)
export default userModel