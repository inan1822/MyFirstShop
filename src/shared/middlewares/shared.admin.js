export const isAdmin = (req, res, next) => {
    if (req.user.role !== "admin") {
        return res.status(403).json({
            status: "403",
            message: "access denied, admins only",
            data: null
        })
    }
    next()
}