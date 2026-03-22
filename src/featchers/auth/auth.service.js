import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
import userModel from "../users/User.model.js"
import {
    sendVerificationEmail,
    sendResetPasswordEmail
} from "../../shared/utils/mailer.js"

const generateCode = () => {
    return Math.floor(100000 + Math.random() * 900000).toString()
}

export const registerService = async ({ name, email, password }) => {
    const existingUser = await userModel.findOne({ email })
    if (existingUser) {
        throw { status: 409, message: "User with this email already exists" }
    }

    const code = generateCode()

    const newUser = await userModel.create({
        name,
        email,
        password,
        sendVerificationCode: code,
        sendVerificationCodeExpiry: Date.now() + 24 * 60 * 60 * 1000
    })

    await sendVerificationEmail(email, code)

    return newUser
}

export const verifyEmailService = async ({ email, code }) => {
    const user = await userModel.findOne({ email })
    if (!user) {
        throw { status: 404, message: "User not found" }
    }

    if (user.sendVerificationCode !== code) {
        throw { status: 400, message: "Invalid code" }
    }

    user.isVerified = true
    user.sendVerificationCode = null
    await user.save()

    return { message: "Email verified successfully" }
}

export const loginService = async ({ email, password }) => {
    const user = await userModel.findOne({ email }).select("+password")
    if (!user) {
        throw { status: 401, message: `User with ${email} not found` }
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password)
    if (!isPasswordCorrect) {
        throw { status: 401, message: "Invalid password" }
    }

    if (!user.isVerified) {
        throw { status: 403, message: "User not verified" }
    }

    // admin needs 2FA
    if (user.role === "admin") {
        const code = generateCode()
        user.twoFactorCode = code
        user.twoFactorExpiry = Date.now() + 10 * 60 * 1000
        await user.save()
        await sendVerificationEmail(email, code)
        return { requiresTwoFactor: true }
    }

    const token = jwt.sign(
        { id: user._id, name: user.name, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: "2h" }
    )

    await userModel.findByIdAndUpdate(user._id, { token })

    return {
        requiresTwoFactor: false,
        token,
        userID: user._id
    }
}

export const verifyTwoFactorService = async ({ email, code }) => {
    const user = await userModel.findOne({
        email,
        twoFactorCode: code,
        twoFactorExpiry: { $gt: Date.now() }
    })

    if (!user) {
        throw { status: 400, message: "Invalid or expired code" }
    }

    user.twoFactorCode = null
    user.twoFactorExpiry = null
    await user.save()

    const token = jwt.sign(
        { id: user._id, name: user.name, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: "2h" }
    )

    await userModel.findByIdAndUpdate(user._id, { token })

    return { token }
}

export const logoutService = async (userId) => {
    await userModel.findByIdAndUpdate(userId, { token: null })
}

export const getMeService = async (userId) => {
    const user = await userModel.findById(userId).select("-password").lean()
    if (!user) {
        throw { status: 404, message: "User not found" }
    }
    return user
}

export const requestPasswordResetService = async ({ email }) => {
    const user = await userModel.findOne({ email })
    if (!user) {
        throw { status: 404, message: "User not found" }
    }

    const resetToken = generateCode()
    user.resetPasswordToken = resetToken
    user.resetPasswordExpiry = Date.now() + 60 * 60 * 1000
    await user.save()

    await sendResetPasswordEmail(email, resetToken)

    return { message: "Password reset email sent" }
}

export const resetPasswordService = async ({ token, newPassword }) => {
    const user = await userModel.findOne({
        resetPasswordToken: token,
        resetPasswordExpiry: { $gt: Date.now() }
    })

    if (!user) {
        throw { status: 400, message: "Invalid or expired token" }
    }

    user.password = newPassword
    user.resetPasswordToken = null
    user.resetPasswordExpiry = null
    await user.save()

    return { message: "Password reset successfully" }
}