
export const checkPermissions = (req, res, next) => {

    const { id: userIdFromToken } = req.user
    const { id: userIdFromUrl } = req.params

    if (String(userIdFromToken) !== String(userIdFromUrl)) {
        return res.status(403).json({
            status: "403",
            message: "Access denied: you can only modify your own account",
            data: null
        })
    }
    console.log(userIdFromToken);

    next()
}