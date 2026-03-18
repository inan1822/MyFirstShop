import { getUser, getAll, deleteUser, updateUser, requestPasswordReset, resetPassword, promoteToAdmin, addAddress, addToCart, removeFromCart, getCart, deleteAddress } from "./users.controller.js"
import { Router } from "express"
import { authMiddleware } from "../../shared/middlewares/shared.middlewares.js"
import { checkPermissions } from "../../shared/middlewares/shared.permissions.js"
import { isAdmin } from "../../shared/middlewares/shared.admin.js"
const userRouter = Router()

userRouter.get("/:id", getUser)
userRouter.get("/", getAll)
userRouter.delete("/:id", authMiddleware, checkPermissions, deleteUser)
userRouter.patch("/:id", authMiddleware, checkPermissions, updateUser)
userRouter.patch("/:id", authMiddleware, isAdmin, promoteToAdmin)
userRouter.post("/request-password-reset", requestPasswordReset)
userRouter.post("/reset-password", resetPassword)
userRouter.post("/address", authMiddleware, addAddress)
userRouter.delete("/address/:addressId", authMiddleware, deleteAddress)
userRouter.post("/cart", authMiddleware, addToCart)
userRouter.delete("/cart/:productId", authMiddleware, removeFromCart)
userRouter.get("/cart", authMiddleware, getCart)
export default userRouter 