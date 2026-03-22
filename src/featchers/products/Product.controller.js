
import productModel from "./Products.Model.js"
import { uploadToCloud, deleteImage } from "./cloudinary.service.js"

export const createProduct = async (req, res) => {
    try {
        const { Title, Price, description, category, stock } = req.body
        const UserId = req.user.id

        if (!UserId) {
            return res.status(401).json({
                status: "401",
                message: "You must be logged in to create a product",
                data: null
            })
        }

        if (!Title || !Price || !description || !category || !stock) {
            return res.status(400).json({
                status: "400",
                message: "Please provide all required fields",
                data: null
            })
        }

        const usedTitle = await productModel.findOne({ Title, createdBy: UserId })
        if (usedTitle) {
            return res.status(400).json({
                status: "400",
                message: "You already have a product with this title",
                data: null
            })
        }

        if (req.file) {
            const result = await uploadToCloud(req.file.buffer, "image")
            req.body.imageUrl = result.secure_url
            req.body.imagePublicId = result.public_id
        }

        const newProduct = await productModel.create({
            Title,
            Price,
            description,
            category,
            stock,
            imageUrl: req.body.imageUrl || null,
            imagePublicId: req.body.imagePublicId || null,
            createdBy: UserId
        })

        res.status(201).json({
            status: "201",
            message: "Product created successfully",
            data: newProduct
        })

    } catch (error) {
        return res.status(500).json({
            status: "500",
            message: "Server error",
            data: error.message
        })
    }
}

export const getProduct = async (req, res) => {
    try {
        const productID = req.params.id
        const OneProduct = await productModel.findOne({ _id: productID, isActive: true })
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
        const {
            page = 1,
            limit = 10,
            category,
            minPrice,
            maxPrice,
            sort = "createdAt",
            order = "desc",
            search
        } = req.query

        // build filter object
        const filter = { isActive: true }

        if (category) {
            filter.category = category
        }

        if (minPrice || maxPrice) {
            filter.Price = {}
            if (minPrice) filter.Price.$gte = Number(minPrice)
            if (maxPrice) filter.Price.$lte = Number(maxPrice)
        }

        if (search) {
            filter.Title = { $regex: search, $options: "i" }  // case-insensitive search
        }

        // pagination
        const pageNum = parseInt(page)
        const limitNum = parseInt(limit)
        const skip = (pageNum - 1) * limitNum

        // sort
        const sortOrder = order === "asc" ? 1 : -1
        const sortObj = { [sort]: sortOrder }

        // run queries in parallel for performance
        const [products, totalCount] = await Promise.all([
            productModel.find(filter)
                .select("Title Price description category stock sold averageRating imageUrl isActive createdAt")
                .sort(sortObj)
                .skip(skip)
                .limit(limitNum)
                .lean(),
            productModel.countDocuments(filter)
        ])

        return res.status(200).json({
            status: "200",
            message: "Successfully retrieved all products",
            data: {
                products,
                currentPage: pageNum,
                totalPages: Math.ceil(totalCount / limitNum),
                totalCount,
                hasNextPage: pageNum < Math.ceil(totalCount / limitNum),
                hasPrevPage: pageNum > 1
            }
        })

    } catch (error) {
        return res.status(500).json({
            status: "500",
            message: "Cannot get products",
            data: error.message
        })
    }
}

export const getUsersProducts = async (req, res) => {
    try {
        const userId = req.params.id
        const userProducts = await productModel.find({ createdBy: userId, isActive: true })

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

        const product = await productModel.findById(productId)
        if (!product) {
            return res.status(404).json({
                status: "404",
                message: "Cannot find product",
                data: null
            })
        }

        // soft delete — just hide it instead of removing from DB
        product.isActive = false
        await product.save()

        return res.status(200).json({
            status: "200",
            message: "Product deleted successfully",
            data: null
        })

    } catch (error) {
        return res.status(500).json({
            status: "500",
            message: "Cannot delete product",
            data: error.message
        })
    }
}



export const updateProduct = async (req, res) => {
    try {
        const productId = req.params.id
        const UserId = req.user.id
        const { Title, Price, description, category, stock, isActive } = req.body

        // check at least one field is provided
        if (!Title && !Price && !description && !category && stock === undefined && isActive === undefined) {
            return res.status(400).json({
                status: "400",
                message: "Nothing to update, provide at least one field",
                data: null
            })
        }

        if (Price !== undefined && (typeof Price !== 'number' || Price < 0)) {
            return res.status(400).json({
                status: "400",
                message: "Price must be a non-negative number",
                data: null
            })
        }

        // make sure product belongs to this user
        const product = await productModel.findOne({ _id: productId, createdBy: UserId })
        if (!product) {
            return res.status(404).json({
                status: "404",
                message: "Product not found or you don't own it",
                data: null
            })
        }

        // handle image update
        if (req.file) {
            // delete old image from cloudinary first
            if (product.imagePublicId) {
                await deleteFromCloud(product.imagePublicId)
            }
            const result = await uploadToCloud(req.file.buffer, "image")
            req.body.imageUrl = result.secure_url
            req.body.imagePublicId = result.public_id
        }

        // only update fields that were actually provided
        const updatedProduct = await productModel.findOneAndUpdate(
            { _id: productId, createdBy: UserId },
            {
                ...(Title && { Title }),
                ...(Price !== undefined && { Price }),
                ...(description && { description }),
                ...(category && { category }),
                ...(stock !== undefined && { stock }),
                ...(isActive !== undefined && { isActive }),
                ...(req.body.imageUrl && { imageUrl: req.body.imageUrl }),
                ...(req.body.imagePublicId && { imagePublicId: req.body.imagePublicId }),
            },
            { new: true, runValidators: true }
        )

        return res.status(200).json({
            status: "200",
            message: "Product updated successfully",
            data: updatedProduct
        })

    } catch (error) {
        return res.status(500).json({
            status: "500",
            message: "Cannot update product",
            data: error.message
        })
    }
}

export const addRating = async (req, res) => {
    try {
        const productId = req.params.id
        const UserId = req.user.id
        const { rating, comment } = req.body

        // validate input
        if (!rating || !comment) {
            return res.status(400).json({
                status: "400",
                message: "Please provide rating and comment",
                data: null
            })
        }

        // find product
        const product = await productModel.findById(productId)
        if (!product) {
            return res.status(404).json({
                status: "404",
                message: "Product not found",
                data: null
            })
        }

        // check if user already rated this product
        const alreadyRated = product.ratings.find(r => r.user.toString() === UserId)
        if (alreadyRated) {
            return res.status(400).json({
                status: "400",
                message: "You already rated this product",
                data: null
            })
        }

        // check user is not rating their own product
        if (product.createdBy.toString() === UserId) {
            return res.status(400).json({
                status: "400",
                message: "You cannot rate your own product",
                data: null
            })
        }

        // add the rating
        product.ratings.push({ user: UserId, rating, comment })

        // recalculate average rating
        const total = product.ratings.reduce((sum, r) => sum + r.rating, 0)
        product.averageRating = (total / product.ratings.length).toFixed(1)

        await product.save()

        return res.status(200).json({
            status: "200",
            message: "Rating added successfully",
            data: product
        })

    } catch (error) {
        return res.status(500).json({
            status: "500",
            message: "Server error",
            data: error.message
        })
    }
}