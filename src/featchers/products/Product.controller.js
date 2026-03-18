
import product from "./Products.Model.js"
import { uploadToCloud, deleteImage } from "./cloudinary.service.js"

export const createProduct = async (req, res) => {
    try {

        const { Title, Price } = req.body
        const UserId = req.user.id
        const Username = req.user.name
        const usedtitle = await product.findOne({ Title, createdBy: UserId })



        if (!req.user || !UserId) {
            return res.status(401).json({
                status: "401",
                message: "You must be logged in to create a product",
                data: null
            })
        }

        if (!Title || !Price)
            return res.status(400).json({
                status: "400",
                message: "User didnt provide title or price",
                data: null
            })
        if (usedtitle)
            return res.status(400).json({
                status: "400",
                message: "cant use same title more then one time",
                data: null
            })

        if (req.file) {
            const result = await uploadToCloud(req.file.buffer, "image")
            req.body.imageUrl = result.secure_url
            req.body.imagePublicId = result.public_id

        }


        const newProduct = await product.create({ Title, Price, imageUrl: req.body.imageUrl, imagePublicId: req.body.imagePublicId, createdBy: UserId })

        return res.status(200).json({
            status: "200",
            message: `${Username} created product`,
            data: newProduct
        })



    } catch (err) {
        return res.status(500).json({
            status: "500",
            message: "canot create product",
            data: err.message
        })
    }
}

export const getProduct = async (req, res) => {
    try {
        const productID = req.params.id
        const OneProduct = await product.findById(productID)
        if (!OneProduct)
            return res.status(404).json({
                status: "404",
                message: "cannot find product",
                data: null
            })

        return res.status(200).json({
            status: "200",
            message: `found product`,
            data: OneProduct
        })


    } catch (error) {
        return res.status(500).json({
            status: "500",
            message: "cannot get product",
            data: error.message
        })
    }
}
export const getAllProducts = async (req, res) => {
    try {
        const allProducts = await product.find()

        return res.status(200).json({
            status: "200",
            message: "Successfully retrieved all products",
            data: allProducts
        })
    } catch (error) {
        return res.status(500).json({
            status: "500",
            message: "cannot get products",
            data: error.message
        })
    }
}
export const getUsersProducts = async (req, res) => {
    try {
        const userId = req.params.id
        const userProducts = await product.find({ createdBy: userId })

        if (!userProducts)
            return res.status(404).json({
                status: "404",
                message: "cannot find user",
                data: null
            })



        return res.status(200).json({
            status: "200",
            message: "Successfully retrieved all products",
            data: userProducts
        })
    } catch (error) {
        return res.status(500).json({
            status: "500",
            message: "cannot get products",
            data: error.message
        })
    }
}
export const deleteProduct = async (req, res) => {
    try {

        const productId = req.params.id
        const userProducts = await product.findById({ _id: productId })
        if (!userProducts)
            return res.status(404).json({
                status: "404",
                message: "cannot find product",
                data: null
            })

        const imgaeId = userProducts.imagePublicId
        if (imgaeId) {
            await deleteImage(imgaeId)
        }

        await product.findByIdAndDelete({ _id: productId })
        return res.status(200).json({
            status: "200",
            message: "Successfully deleted product",
            data: null
        })
    } catch (error) {
        return res.status(500).json({
            status: "500",
            message: "cannot delete product",
            data: error.message
        })
    }
}



export const updateProduct = async (req, res) => {
    try {
        const productId = req.params.id
        const { Title, Price } = req.body


        if (!Title && !Price) {
            return res.status(400).json({
                status: "400",
                message: "Nothing to update (provide at least Title or Price)",
                data: null
            });
        }
        if (Price !== undefined && (typeof Price !== 'number' || Price < 0)) {
            return res.status(400).json({
                status: "400",
                message: "Price must be a non-negative number",
                data: null
            })
        }
        const userProduct = await product.findOneAndUpdate({ _id: productId }, { Title, Price }, { new: true, runValidators: true })

        if (!userProduct)
            return res.status(404).json({
                status: "404",
                message: "cannot find product",
                data: null
            })



        return res.status(200).json({
            status: "200",
            message: "Successfully updated product",
            data: userProduct
        })
    } catch (error) {
        return res.status(500).json({
            status: "500",
            message: "cannot update product",
            data: error.message
        })
    }
}

