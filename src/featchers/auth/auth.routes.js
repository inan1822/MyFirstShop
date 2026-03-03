import { register, login, verifyEmail } from "./auth.controller.js"
import { Router } from "express"

const authRouter = Router()

authRouter.post("/register", register)
authRouter.post("/verify", verifyEmail)
authRouter.post("/login", login)

export default authRouter