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
            })
        }
        if (!name || !email || !password) {
            return res.status(400).json({
                status: "400",
                message: "all fields are required",
                data: null
            })
        }
        const passwordHash = await bcrypt.hash(password, 10)
        const code = generateCode()
        const newUser = await userModel.create({ name, email, password: passwordHash, sendVerificationCode: code })
        await sendVerificationEmail(email, code)

        res.status(201).json({
            status: "201",
            message: "user created successfully",
            data: newUser
        })

    } catch (error) {
        console.log(error)
        return res.status(500).json({
            status: "500",
            message: "cant register user",
            data: error.message
        })
    }
}

export async function verifyEmail(req, res) {
    try {
        const { email, code } = req.body;

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

        const token = jwt.sign(
            // כדאי לקרוא לזה id, וזה מה שיהיה בתוך req.user אחרי ה-verify
            {
                id: emailUser._id,
                name: emailUser.name
            },
            process.env.JWT_SECRET,
            { expiresIn: "2h" }
        )

        return res.status(200).json({
            status: "200",
            message: "loged in ",
            data: {
                token: token,
                userID: emailUser._id
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