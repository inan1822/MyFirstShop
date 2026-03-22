
import bcrypt from "bcrypt"
import productModel from "../products/Products.Model.js"
import userModel from "./User.model.js"

import orderModel from "../order/Order.model.js"

export const getUser = async (req, res) => {
    try {
        const UserId = req.params.id
        const OneUser = await userModel.findById(UserId).lean()
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
            error: error.message,
            data: null
        })

    }
}

export const getAll = async (req, res) => {
    try {
        const allUsers = await userModel.find().select("-password").lean()

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
            error: error.message,
            data: null
        })

    }
}
export const deleteUser = async (req, res) => {
    try {
        const UserId = req.params.id

        // const userNameType = req.body.name
        // const userName = user.name

        // if (userNameType !== userName) {
        //     return res.status(400).json({
        //         message: "Wrong name"
        //     })
        // }
        // 1. מצא את המשתמש
        const user = await userModel.findById(UserId)
        if (!user) {
            return res.status(404).json({
                status: "404",
                message: "User doesn't exist",
                data: null
            })
        }

        await Promise.all([
            productModel.deleteMany({ createdBy: UserId }),

            orderModel.deleteMany({ orderedBy: UserId }),
        ])
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
export const deleteMyUser = async (req, res) => {
    try {
        const UserId = req.params.id
        const { password } = req.body

        // 1. מצא את המשתמש
        const user = await userModel.findById(UserId).select("+password")
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
        await Promise.all([
            productModel.deleteMany({ createdBy: UserId }),

            orderModel.deleteMany({ orderedBy: UserId }),
        ])
        // 3. מחיקהs
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

        const user = await userModel.findById(userId).select("+password")

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



export const promoteToAdmin = async (req, res) => {
    try {
        const userId = req.params.id

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

        const alreadyExists = user.addresses.some(
            addr =>
                addr.street === street &&
                addr.city === city &&
                addr.country === country &&
                addr.zipCode === zipCode
        )
        if (alreadyExists) return res.status(400).json({
            status: "400",
            message: "address already exists",
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