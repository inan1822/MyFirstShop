import cartModel from "./cart.model.js"
import productModel from "../products/Products.Model.js"

// GET / — get current cart
export const getCart = async (req, res) => {
    try {
        const UserId = req.user.id

        const cart = await cartModel.findOne({ userId: UserId })
            .lean()
        if (!cart) {
            return res.status(200).json({
                status: "200",
                message: "Cart is empty",
                data: { items: [] }
            })
        }

        return res.status(200).json({
            status: "200",
            message: "your saver productsg   ",
            data: cart
        })

    } catch (error) {
        return res.status(500).json({
            status: "500",
            message: "Server error",
            data: error.message
        })
    }
}

// POST / — add item to cart or update quantity if already exists
export const addToCart = async (req, res) => {
    try {
        const UserId = req.user.id
        const { productId, quantity } = req.body

        if (!productId) {
            return res.status(400).json({
                status: "400",
                message: "Product id is required",
                data: null
            })
        }

        // find the product
        const product = await productModel.findById(productId)
        if (!product) {
            return res.status(404).json({
                status: "404",
                message: "Product not found",
                data: null
            })
        }

        if (product.stock < 1) {
            return res.status(400).json({
                status: "400",
                message: "Product is out of stock",
                data: null
            })
        }

        // find or create cart
        let cart = await cartModel.findOne({ userId: UserId })
        if (!cart) {
            cart = await cartModel.create({
                userId: UserId,
                items: []
            })
        }

        // check if product already in cart
        const existingItem = cart.items.find(
            item => item.productId.toString() === productId
        )

        if (existingItem) {
            // update quantity
            existingItem.quantity += quantity || 1
        } else {
            // add new item
            cart.items.push({
                productId: product._id,
                name: product.Title,
                price: product.Price,
                quantity: quantity || 1,
                image: product.imageUrl
            })
        }

        await cart.save()

        return res.status(200).json({
            status: "200",
            message: "Cart updated successfully",
            data: cart
        })

    } catch (error) {
        return res.status(500).json({
            status: "500",
            message: "Server error",
            data: error.message
        })
    }
}

// PUT /:productId — update quantity of specific item
export const updateCartItem = async (req, res) => {
    try {
        const UserId = req.user.id
        const { productId } = req.params
        const { quantity } = req.body

        if (!quantity || quantity < 1) {
            return res.status(400).json({
                status: "400",
                message: "Quantity must be at least 1",
                data: null
            })
        }

        const cart = await cartModel.findOne({ userId: UserId })
        if (!cart) {
            return res.status(404).json({
                status: "404",
                message: "Cart not found",
                data: null
            })
        }

        const item = cart.items.find(
            item => item.productId.toString() === productId
        )

        if (!item) {
            return res.status(404).json({
                status: "404",
                message: "Item not found in cart",
                data: null
            })
        }

        item.quantity = quantity
        await cart.save()

        return res.status(200).json({
            status: "200",
            message: "Cart item updated successfully",
            data: cart
        })

    } catch (error) {
        return res.status(500).json({
            status: "500",
            message: "Server error",
            data: error.message
        })
    }
}


export const removeFromCart = async (req, res) => {
    try {
        const userId = req.user.id
        const { productId } = req.params

        const cart = await cartModel.findOne({ userId })
        if (!cart) {
            return res.status(404).json({
                status: "404",
                message: "Cart not found",
                data: null
            })
        }


        const itemExists = cart.items.some(
            item => item.productId.toString() === productId
        )
        if (!itemExists) {
            return res.status(404).json({
                status: "404",
                message: "Item not found in cart",
                data: null
            })
        }

        cart.items = cart.items.filter(
            item => item.productId.toString() !== productId
        )

        await cart.save()

        return res.status(200).json({
            status: "200",
            message: "Item removed from cart",
            data: cart
        })

    } catch (error) {
        return res.status(500).json({
            status: "500",
            message: "Server error",
            data: error.message
        })
    }
}


export const clearCart = async (req, res) => {
    try {
        const UserId = req.user.id

        const cart = await cartModel.findOne({ userId: UserId })
        if (!cart) {
            return res.status(404).json({
                status: "404",
                message: "Cart not found",
                data: null
            })
        }

        cart.items = []
        await cart.save()

        return res.status(200).json({
            status: "200",
            message: "Cart cleared successfully",
            data: cart
        })

    } catch (error) {
        return res.status(500).json({
            status: "500",
            message: "Server error",
            data: error.message
        })
    }
}

// POST /sync — sync localStorage cart with DB
export const syncCart = async (req, res) => {
    try {
        const UserId = req.user.id
        const { items } = req.body

        if (!items || items.length === 0) {
            return res.status(400).json({
                status: "400",
                message: "No items to sync",
                data: null
            })
        }

        // find or create cart
        let cart = await cartModel.findOne({ userId: UserId })

        if (!cart) {
            cart = await cartModel.create({ userId: UserId, items: [] })
        }

        // merge localStorage items with DB cart
        for (const localItem of items) {
            const product = await productModel.findById(localItem.productId)
            if (!product) continue

            const existingItem = cart.items.find(
                item => item.productId.toString() === localItem.productId
            )

            if (existingItem) {
                // take the higher quantity
                existingItem.quantity = Math.max(existingItem.quantity, localItem.quantity)
            } else {
                cart.items.push({
                    productId: product._id,
                    name: product.Title,
                    price: product.Price,
                    quantity: localItem.quantity,
                    image: product.imageUrl
                })
            }
        }

        await cart.save()

        return res.status(200).json({
            status: "200",
            message: "Cart synced successfully",
            data: cart
        })

    } catch (error) {
        return res.status(500).json({
            status: "500",
            message: "Server error",
            data: error.message
        })
    }
}