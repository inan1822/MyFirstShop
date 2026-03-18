import userModel from "./User.model.js"
import bcrypt from "bcrypt"
import { sendResetPasswordEmail } from "../../shared/utils/mailer.js"
import crypto from "crypto"

export const getUser = async (req, res) => {
    try {
        const UserId = req.params.id
        const OneUser = await userModel.findById(UserId)
        if (!OneUser)
            return res.status(400).json({
                status: "400",
                message: "user doesent exists",
                data: null
            })

        res.status(201).json({
            status: "201",
            message: `user ${UserId} found`,
            data: OneUser
        })

    } catch (error) {
        return res.status(500).json({
            status: "500",
            message: "cant find user",
            data: null
        })

    }
}

export const getAll = async (req, res) => {
    try {
        const allUsers = await userModel.find().select("-password")

        res.status(200).json({
            status: "200",
            message: "All users fetched successfully",
            count: allUsers.length,
            data: allUsers
        });
    } catch (error) {
        return res.status(500).json({
            status: "500",
            message: "cant find users",
            data: null
        })

    }
}
export const deleteUser = async (req, res) => {
    try {
        const UserId = req.params.id
        const { password } = req.body

        // 1. מצא את המשתמש
        const user = await userModel.findById(UserId)
        if (!user) {
            return res.status(404).json({
                status: "404",
                message: "User doesn't exist",
                data: null
            })
        }

        // 2. בדוק סיסמה
        const isPasswordCorrect = await bcrypt.compare(password, user.password)
        if (!password || password.trim() === "" || !isPasswordCorrect) {
            return res.status(401).json({
                status: "401",
                message: "Incorrect password",
                data: null
            })
        }

        // 3. מחיקה
        await userModel.findByIdAndDelete(UserId)

        res.status(200).json({
            status: "200",
            message: `User with email ${user.email} deleted successfully`,
            data: null
        })

    } catch (error) {
        return res.status(500).json({
            status: "500",
            message: "Error during deletion",
            data: error.message
        })
    }
}



export const updateUser = async (req, res) => {
    try {
        const { name, email, currentPassword, newPassword } = req.body
        const userId = req.params.id

        const user = await userModel.findById(userId)

        if (!user)
            return res.status(404).json({
                status: "404",
                message: "user not found",
                data: null
            })


        const isPasswordCorrect = await bcrypt.compare(currentPassword, user.password)
        if (!currentPassword || !isPasswordCorrect) {
            return res.status(401).json({
                status: "401",
                message: "Incorrect password",
                data: null
            })
        }

        // Update fields
        if (name) user.name = name
        if (email) user.email = email
        if (newPassword) user.password = newPassword  // pre-save hook will hash it

        const updatedUser = await user.save()

        res.status(200).json({
            status: "200",
            message: "user updated successfully",
            data: updatedUser
        })

    } catch (error) {
        return res.status(500).json({
            status: "500",
            message: "cant update",
            data: error.message
        })
    }
}

const generateCode = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

export const requestPasswordReset = async (req, res) => {
    try {
        const { email } = req.body

        const user = await userModel.findOne({ email })
        if (!user) {
            return res.status(404).json({ message: "User not found" })
        }

        // Generate secure token
        const resetToken = generateCode()

        user.resetPasswordToken = resetToken
        user.resetPasswordExpiry = Date.now() + 60 * 60 * 1000 // 1 hour
        await user.save()

        // Send email
        await sendResetPasswordEmail(email, resetToken)

        res.json({ message: `Password reset email sent` })

    } catch (error) {
        return res.status(500).json({
            status: "500",
            message: "error",
            data: error.message
        })
    }
}


export const resetPassword = async (req, res) => {
    try {
        const { token, newPassword } = req.body

        // Find user with valid reset token
        const user = await userModel.findOne({
            resetPasswordToken: token,
            resetPasswordExpiry: { $gt: Date.now() }
        })

        if (!user) {
            return res.status(400).json({ message: "Invalid or expired token" })
        }

        // Just set the new password — pre-save hook will hash it automatically
        user.password = newPassword
        user.resetPasswordToken = null
        user.resetPasswordExpiry = null

        await user.save()

        res.json({ message: "Password reset successfully" })

    } catch (error) {
        return res.status(500).json({
            status: "500",
            message: "error",
            data: error.message
        })
    }
}

export const promoteToAdmin = async (req, res) => {
    try {
        const { userId } = req.body

        const user = await userModel.findByIdAndUpdate(
            userId,
            { role: "admin" },
            { new: true }  // returns the updated user
        )

        if (!user) return res.status(404).json({
            status: "404",
            message: "user not found",
            data: null
        })

        res.status(200).json({
            status: "200",
            message: `${user.name} promoted to admin`,
            data: user
        })

    } catch (error) {
        return res.status(500).json({
            status: "500",
            message: "internal server error",
            data: error.message
        })
    }
}

export const addAddress = async (req, res) => {
    try {
        const { street, city, country, zipCode } = req.body
        const userId = req.user.id

        const user = await userModel.findById(userId)

        if (!user) return res.status(404).json({
            status: "404",
            message: "user not found",
            data: null
        })

        user.addresses.push({ street, city, country, zipCode })

        await user.save()

        res.status(201).json({
            status: "201",
            message: "address added successfully",
            data: user.addresses
        })

    } catch (error) {
        return res.status(500).json({
            status: "500",
            message: "internal server error",
            data: error.message
        })
    }
}
export const deleteAddress = async (req, res) => {
    try {
        const userId = req.user.id
        const { addressId } = req.params  // ✅ get addressId from URL

        const user = await userModel.findById(userId)

        if (!user) return res.status(404).json({
            status: "404",
            message: "user not found",
            data: null
        })

        // Check if address exists
        const addressExists = user.addresses.find(
            address => String(address._id) === String(addressId)
        )

        if (!addressExists) return res.status(404).json({
            status: "404",
            message: "address not found",
            data: null
        })

        // Remove address
        user.addresses = user.addresses.filter(
            address => String(address._id) !== String(addressId)
        )

        await user.save()  // ✅ you forgot this

        res.status(200).json({
            status: "200",
            message: "address deleted successfully",
            data: user.addresses
        })

    } catch (error) {
        return res.status(500).json({
            status: "500",
            message: "internal server error",
            data: error.message
        })
    }
}

// ADD TO CART
export const addToCart = async (req, res) => {
    try {
        const { productId, quantity } = req.body
        const userId = req.user.id

        const user = await userModel.findById(userId)
        if (!user) return res.status(404).json({
            status: "404",
            message: "user not found",
            data: null
        })

        // Check if product already in cart
        const existingItem = user.cart.find(
            item => String(item.product) === String(productId)
        )

        if (existingItem) {
            // Just increase quantity
            existingItem.quantity += quantity
        } else {
            // Add new item
            user.cart.push({ product: productId, quantity })
        }

        await user.save()

        res.status(201).json({
            status: "201",
            message: "product added to cart",
            data: user.cart
        })

    } catch (error) {
        return res.status(500).json({
            status: "500",
            message: "internal server error",
            data: error.message
        })
    }
}

// REMOVE FROM CART
export const removeFromCart = async (req, res) => {
    try {
        const { productId } = req.params
        const userId = req.user.id

        const user = await userModel.findById(userId)
        if (!user) return res.status(404).json({
            status: "404",
            message: "user not found",
            data: null
        })

        // Check if product exists in cart
        const itemExists = user.cart.find(
            item => String(item.product) === String(productId)
        )

        if (!itemExists) return res.status(404).json({
            status: "404",
            message: "product not found in cart",
            data: null
        })

        user.cart = user.cart.filter(
            item => String(item.product) !== String(productId)
        )

        await user.save()

        res.status(200).json({
            status: "200",
            message: "product removed from cart",
            data: user.cart
        })

    } catch (error) {
        return res.status(500).json({
            status: "500",
            message: "internal server error",
            data: error.message
        })
    }
}

// GET CART
export const getCart = async (req, res) => {
    try {
        const userId = req.user.id

        const user = await userModel.findById(userId).populate("cart.product")

        if (!user) return res.status(404).json({
            status: "404",
            message: "user not found",
            data: null
        })

        res.status(200).json({
            status: "200",
            message: "cart fetched successfully",
            data: user.cart
        })

    } catch (error) {
        return res.status(500).json({
            status: "500",
            message: "internal server error",
            data: error.message
        })
    }
}