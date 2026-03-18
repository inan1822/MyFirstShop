import express from "express"
import authRouter from "./src/featchers/auth/auth.routes.js"
import userRouter from "./src/featchers/users/users.routes.js"
import productrout from "./src/featchers/products/Product.Routes.js"
import mongoConnect from "./src/config/db.js"
import dotenv from "dotenv"
// import cloudinary from "./src/config/cloudinary.js"
import rateLimit from "express-rate-limit"
import cors from "cors"



dotenv.config()
// לא נחוץ
// cloudinary.config()
const app = express()
// option 1
// app.use(cors())

// option 2
// app.use(cors({ origin: "http://127.0.0.1:5500" }))

// option 3

const allowedOrigins = ["http://127.0.0.1:5500", "http://localhost:5173"]

const corsOptions = {
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true)
        } else {
            callback(new Error("origine not allowed"))
        }
    }
}

app.use(cors(corsOptions))

const blockOriginForPost = ["http://127.0.0.1:5500", "http://127.0.0.1:5501"]
app.use((req, res, next) => {
    const origin = req.get("origin")
    const isBlockedOrigin = Array.isArray(blockOriginForPost)
        ? blockOriginForPost.includes(origin)
        : origin === blockOriginForPost

    if ((req.method === "post" || req.method === "put" || req.method === "delete") && origin && isBlockedOrigin)
        return res.status(403).json({
            message: "not allowed to do post/delet/put"
        })
    next()
})


const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 222,
    standardHeaders: true,
    legacyHeaders: false,
    message: "to much reqests"
})
// בשביל להבדיל בין משתמשים,מביא את הבתובת שלי ולא של
app.set("trust proxy", 1)
app.use(globalLimiter)

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







