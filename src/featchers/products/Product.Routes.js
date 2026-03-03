import { Router } from "express"
import { createProduct, getProduct, getAllProducts, getUsersProducts, deleteProduct, updateProduct } from "./Product.controller.js"
import { authMiddleware } from "../../shared/middlewares/shared.middlewares.js"
import { productPremiision } from "../../shared/middlewares/shared.productPR.js"

const productrout = Router()


productrout.post("/", authMiddleware, createProduct)
productrout.get("/:id", getProduct)
productrout.get("/", getAllProducts)
productrout.get("/user/:id", getUsersProducts)
productrout.delete("/:id", authMiddleware, productPremiision, deleteProduct)
productrout.patch("/:id", authMiddleware, productPremiision, updateProduct)

export default productrout