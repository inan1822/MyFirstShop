export function validateRequest(schema, property) {
    return async (req, res, next) => {
        try {
            const value = req[property] // body, params, query
            const validated = await schema.validateAsync //confirm that the data is correct
                (value, {
                    abortEarly: false, // show all errors at once
                    stripUnknown: true // remove unknown fields
                })
                if (property === "body") {
                    req[property] = validated
                }
            next()
        }  catch (error) {
            // Joi validation error — has error.details
            if (error.isJoi && error.details) {
                return res.status(400).json({
                    status: "400",
                    message: "Validation error",
                    data: error.details.map(detail => ({
                        field: detail.path.join("."),
                        message: detail.message
                    }))
                })
            }

            // ✅ any other unexpected runtime error — don't try to .map() on undefined
            return res.status(500).json({
                status: "500",
                message: "Unexpected validation error",
                data: error.message
            })
        }
    }
}
