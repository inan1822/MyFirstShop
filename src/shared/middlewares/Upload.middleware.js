import multer from "multer"

const storage = multer.memoryStorage()

const upload = multer({
    // מקום לאיחסון
    storage,
    // מגבלת גודל
    limits: { filesize: 5 * 1024 * 1024 },
    fileFilter: (req, file, callback) => {

        const allowedFiles = [
            "image/jpeg",
            "image/png",
            "image/jpg",
            "image/webp",
            `image/svg`
        ]


        // בודק שהסוג קובץ שהרשאתי באמת מהסוג MIMETYPE
        if (allowedFiles.includes(file.mimetype)) {
            callback(null, true)
        }
        else {
            callback(new Error("Invalid file type"), false)
        }
    }


})

export const uploadsingle = upload.single("image")
export const uploadmultiple = upload.array("images", 5)