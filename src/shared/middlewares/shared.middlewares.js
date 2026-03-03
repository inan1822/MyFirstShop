import jwt from "jsonwebtoken"
import dotenv from "dotenv"

dotenv.config()

export const authMiddleware = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization
        const inputToken = authHeader && authHeader.split(" ")[1]
        if (!inputToken) {
            return res.status(401).json({
                status: "401",
                message: "Access Denied: No Token Provided"
            });
        }

        const decoded = jwt.verify(inputToken, process.env.JWT_SECRET)
        req.user = decoded

        next();

    } catch (error) {
        // אם הטוקן לא תקין או פג תוקף
        return res.status(403).json({
            status: "403",
            message: "Invalid or Expired Token",
            data: error.message
        })
    }
}




