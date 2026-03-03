import { getUser, getAll, deleteUser, updatUser } from "./users.controller.js"
import { Router } from "express"
import { authMiddleware } from "../../shared/middlewares/shared.middlewares.js"
import { checkPermissions } from "../../shared/middlewares/shared.permissions.js"
const userRouter = Router()

userRouter.get("/:id", getUser)
userRouter.get("/", getAll)
userRouter.delete("/:id", authMiddleware, checkPermissions, deleteUser)
userRouter.patch("/:id", authMiddleware, checkPermissions, updatUser)

export default userRouter 