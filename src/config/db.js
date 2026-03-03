import mongoose from "mongoose"
import dotenv from "dotenv"

dotenv.config()

const mongoConnect = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI)
    } catch (error) {
        console.log("cant connect to mongoo")
    }
}



export default mongoConnect