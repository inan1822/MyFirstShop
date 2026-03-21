import mongoose from "mongoose"
import dotenv from "dotenv"

dotenv.config()

const mongoConnect = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI, {
            serverSelectionTimeoutMS: 5000,
        })
        console.log("MongoDB connected successfully ")
    } catch (error) {
        console.log("cant connect to mongoo:", error.message)

        setTimeout(mongoConnect, 5000)
    }
}

export default mongoConnect