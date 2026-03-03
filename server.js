import express from "express"
import authRouter from "./src/featchers/auth/auth.routes.js"
import userRouter from "./src/featchers/users/users.routes.js"
import productrout from "./src/featchers/products/Product.Routes.js"
import mongoConnect from "./src/config/db.js"
import dotenv from "dotenv"



dotenv.config()
const app = express()

app.use(express.json())

app.use("/log", authRouter)
app.use("/user", userRouter)
app.use("/product", productrout)

app.get("/", (req, res) => {
    res.status(200).send("server is running")
})


mongoConnect().then(() => {
    app.listen(3000, () => {
        console.log("Database connected and server is running on port 3000")
    })
}).catch(err => {
    console.log("Failed to connect to DB:", err)
})







