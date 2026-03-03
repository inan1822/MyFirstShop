import userModel from "./User.model.js"
import bcrypt from "bcrypt"

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



export const updatUser = async (req, res) => {
    try {
        const { name, email, password } = req.body
        const UserId = req.params.id
        const user = await userModel.findById(UserId)
        // const updateuser = await userModel.updateOne({_id: UserId},{name,email,password})

        if (!user)
            return res.status(404).json({
                status: "404",
                message: "user not found",
                data: null
            })

        const isPasswordCorrect = await bcrypt.compare(password, user.password)
        if (!password || password.trim() === "" || !isPasswordCorrect) {
            return res.status(401).json({
                status: "401",
                message: "Incorrect password",
                data: null
            })
        }

        const updatedUser = await userModel.findByIdAndUpdate(
            UserId,
            { name, email },
            { returnDocument: "after" }).
            select("-password")

        res.status(200).json({
            status: "200",
            message: `user got updated`,
            data: updatedUser
        });
    } catch (error) {
        return res.status(500).json({
            status: "500",
            message: "cant update",
            data: error.message
        })
    }
}
