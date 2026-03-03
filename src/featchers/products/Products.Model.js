import mongoose from "mongoose"


const productSchema = new mongoose.Schema({

    Price: {
        required: true,
        type: Number,
        min: 0
    },

    Title: {
        required: true,
        type: String
    },

    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: true
    }
}, { timestamps: true })


const productModel = mongoose.model("product", productSchema)
export default productModel
