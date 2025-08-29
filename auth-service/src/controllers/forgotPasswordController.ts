import logger from "../utils/logger"
import prisma from "../prismaClient"
import { sendPasswordResetEmail } from "../mail/email"
import { validateForgotPasswordRequest } from "../utils/validation"
import { Request, Response } from "express"
import { generateResetPasswordToken } from "../utils/generateToken"
import { User } from "../types/types"

export const forgotPasswordUser = async (req: Request, res: Response) => {
	logger.info("Forgot password request endpoint hit")
	try {
		const { email } = req.body
		const { error } = validateForgotPasswordRequest({ email })
		if (error) {
			logger.error("Forgot password validation error", error.details)
			return res
				.status(400)
				.json({ success: false, message: error.details[0].message })
		}

		if (!email) {
			logger.error("Email not provided")
			return res
				.status(400)
				.json({ success: false, message: "Email not provided" })
		}

		const user = await prisma.user.findUnique({
			where: { email },
		})

		if (!user) {
			logger.error("User not found")
			return res.status(404).json({ success: false, message: "User not found" })
		}

		const twoFactorCode = Math.floor(100000 + Math.random() * 900000).toString()

		await prisma.user.update({
			where: { id: user.id },
			data: {
				twoFactorCode,
				twoFactorExp: new Date(Date.now() + 3 * 60 * 1000), // 3 minutes from current
			},
		})

		await generateResetPasswordToken(res, user as User)
		await sendPasswordResetEmail(user.email, twoFactorCode)

		logger.info("Forgot password request successful", { userId: user.id })

		return res.status(200).json({
			success: true,
			message: "Forgot password request successful",
		})
	} catch (err) {
		logger.error("Error processing forgot password request", err)
		return res.status(500).json({
			success: false,
			message: err instanceof Error ? err.message : "Internal server error",
		})
	}
}
