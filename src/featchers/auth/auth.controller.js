import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
import userModel from "../users/User.model.js"
import { sendVerificationEmail } from "../../shared/utils/mailer.js"

const generateCode = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

export const register = async (req, res) => {
    try {
        const { name, email, password } = req.body

        const exisUser = await userModel.findOne({ email })
        if (exisUser) {
            return res.status(409).json({
                status: "409",
                message: "user with this email or name already exists",
                data: null
            });
        }

        if (!name || !email || !password) {
            return res.status(400).json({
                status: "400",
                message: "all fields are required",
                data: null
            });
        }

        const code = generateCode()

        // const passwordHash = await bcrypt.hash(password, 10)
        const newUser = await userModel.create({
            name,
            email,
            password,
            sendVerificationCode: code,
            sendVerificationCodeExpiry: Date.now() + 24 * 60 * 60 * 1000
        });

        await sendVerificationEmail(email, code)

        res.status(201).json({
            status: "201",
            message: "user created successfully",
            data: newUser
        });

    } catch (error) {
        console.log(error);
        return res.status(500).json({
            status: "500",
            message: "cant register user",
            data: error.message
        })
    }
}

export async function verifyEmail(req, res) {
    try {
        const { email, code } = req.body

        const user = await userModel.findOne({ email });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        if (user.sendVerificationCode !== code) {
            return res.status(400).json({ message: "Invalid code" });
        }

        user.isVerified = true;
        user.sendVerificationCode = null;

        await user.save();

        res.status(200).json({ message: "Email verified successfully" });
    } catch (error) {
        res.status(500).json({ error: "Something went wrong" });
    }
}
// export const logout = async (req, res) => {
//     try {


export const logout = async (req, res) => {
    try {
        await userModel.findByIdAndUpdate(req.user.id, { token: null })

        res.status(200).json({
            status: "200",
            message: "Logged out successfully",
            data: null
        })

    } catch (error) {
        return res.status(500).json({
            status: "500",
            message: "Server error",
            data: error.message
        })
    }
}

export const login = async (req, res) => {
    try {
        const { email, password } = req.body
        const emailUser = await userModel.findOne({ email })
        if (!emailUser)
            return res.status(401).json({
                status: "401",
                message: `user with ${email} not found`,
                data: null
            })
        const passwordUser = await bcrypt.compare(password, emailUser.password)
        if (!passwordUser)
            return res.status(401).json({
                status: "401",
                message: "invalid password",
                data: null
            })


        if (!emailUser.isVerified)
            return res.status(403).json({
                status: "403",
                message: "user not verified",
                data: null
            })
        if (emailUser.role === "admin") {
            const code = generateCode()

            emailUser.twoFactorCode = code
            emailUser.twoFactorExpiry = Date.now() + 10 * 60 * 1000  // 10 minutes

            await emailUser.save()
            await sendVerificationEmail(email, code)  // reuse your existing function

            return res.status(200).json({
                message: "2FA code sent to your email",
                debug: `remove code from here later ${code}`
            })
        }
        const token = jwt.sign(
            // כדאי לקרוא לזה id, וזה מה שיהיה בתוך req.user אחרי ה-verify
            {
                id: emailUser._id,
                name: emailUser.name
            },
            process.env.JWT_SECRET,
            { expiresIn: "2h" }
        )
        await userModel.findByIdAndUpdate(emailUser._id, { token: token })

        return res.status(200).json({
            status: "200",
            message: "loged in ",
            data: {
                token: token,
                userID: emailUser._id,

            }
        })


    } catch (error) {
        return res.status(500).json({
            status: "500",
            message: "internal server error",
            data: null
        })
    }
}

export const getMe = async (req, res) => {
    try {
        const user = await userModel.findById(req.user.id).select("-password")
        if (!user) {
            return res.status(404).json({
                status: "404",
                message: "User not found",
                data: null
            })
        }

        res.status(200).json({
            status: "200",
            message: "User fetched successfully",
            data: user
        })

    } catch (error) {
        return res.status(500).json({
            status: "500",
            message: "Server error",
            data: error.message
        })
    }
}


export const verifyTwoFactor = async (req, res) => {
    try {
        const { email, code } = req.body

        const user = await userModel.findOne({
            email,
            twoFactorCode: code,
            twoFactorExpiry: { $gt: Date.now() }  // not expired
        })

        if (!user) return res.status(400).json({ message: "Invalid or expired code" })

        // Clear the code after use
        user.twoFactorCode = null
        user.twoFactorExpiry = null
        await user.save()

        const token = jwt.sign(

            {
                id: user._id,
                name: user.name
            },
            process.env.JWT_SECRET,
            { expiresIn: "2h" }
        )
        await userModel.findByIdAndUpdate(user._id, { token: token })

        res.status(200).json({ message: "Login successful as admin", token })
    } catch (error) {
        return res.status(500).json({
            status: "500",
            message: "internal server error",
            data: error.message
        })
    }
}



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