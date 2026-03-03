import product from "../../featchers/products/Products.Model.js"

export const productPremiision = async (req, res, next) => {
    try {
        const productid = req.params.id
        const userId = req.user.id
        const findProduct = await product.findById(productid)

        if (!findProduct)
            return res.status(404).json({
                status: "404",
                message: "cannot find product",
                data: null
            })

        if (findProduct.createdBy.toString() != userId.toString())
            return res.status(403).json({
                status: "403",
                message: "you are not authorized to delete this product",
                data: null
            })

        next()


    } catch (error) {
        return res.status(500).json({
            status: "500",
            message: "cannot get product",
            data: error.message
        })
    }
}