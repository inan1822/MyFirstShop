import { register, login, verifyEmail, verifyTwoFactor } from "./auth.controller.js"
import { Router } from "express"

const authRouter = Router()

authRouter.post("/register", register)
authRouter.post("/verify", verifyEmail)
authRouter.post("/login", login)
authRouter.post("/admin", verifyTwoFactor)

export default authRouter