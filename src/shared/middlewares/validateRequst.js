export function validateRequest(schema, property) {
    return async (req, res, next) => {
        try {
            const value = req[property] // body, params, query
            const validated = await schema.validateAsync //confirm that the data is correct
                (value, {
                    abortEarly: false, // show all errors at once
                    stripUnknown: true // remove unknown fields
                })
            req[property] = validated
            next()
        } catch (error) {
            if (error.details && Array.isArray(error.details)) {
                const errors = error.details.map((detail) => ({
                    field: detail.path.join("."),
                    message: detail.message
                }))
                return res.status(400).json({
                    status: "400",
                    message: "Validation error",
                    data: errors
                })
            }
            return res.status(400).json({
                status: "400",
                message: "Validation error",
                data: error.details.map(err => err.message)
            })
        }
    }
}