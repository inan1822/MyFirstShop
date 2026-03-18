import nodemailer from "nodemailer"
import dotenv from "dotenv"
dotenv.config()

const transporter = nodemailer.createTransport({
    service: "gmail",

    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
})

export const sendVerificationEmail = async (to, code) => {
    try {

        await transporter.sendMail({
            from: `"My App" <${process.env.EMAIL_USER}>`,
            to: to,
            subject: "Your verification code",
            text: `your verification code is: ${code}`,
            html: `<h1>copy your code: ${code}</h1>`
        })
        console.log("Email sent successfully")
    } catch (error) {
        console.log(error, "Email didn't send")
    }
}
export const sendResetPasswordEmail = async (to, code) => {
    try {
        await transporter.sendMail({
            from: `"My App" <${process.env.EMAIL_USER}>`,
            to: to,
            subject: "Your verification code to reset your password",
            text: `Your verification code is: ${code}`,
            html: `
                <h1>Your verification code is: ${code}</h1>
                <p>If you didn't request this, please secure your account.</p>
            `
        })
        console.log("Email sent successfully")
    } catch (error) {
        console.log(error, "Email didn't send")
    }
}


