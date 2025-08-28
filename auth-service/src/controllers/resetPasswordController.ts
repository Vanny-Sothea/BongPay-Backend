import logger from "../utils/logger"
import prisma from "../prismaClient"
import argon2 from "argon2"
import {
	sendResetSuccessEmail,
} from "../mail/email"
import {
	validateResetPassword,
	validateVerificationToken,
} from "../utils/validation"
import { Request, Response } from "express"


export const resetPasswordUser = async (req: Request, res: Response) => {
	logger.info("Reset password endpoint hit")
	try {
		const token = req.cookies?.resetPasswordToken
		const { newPassword } = req.body

		const { error: InputError } = validateResetPassword({ newPassword })
		const { error: tokenError } = validateVerificationToken({
			token: token,
		})

		if (InputError) {
			logger.error("Input validation error", InputError.details)
			return res
				.status(400)
				.json({ success: false, message: InputError.details[0].message })
		}

		if (tokenError) {
			logger.error("Reset password token validation error", tokenError.details)
			return res
				.status(400)
				.json({ success: false, message: tokenError.details[0].message })
		}

		if (!token) {
			logger.error("No reset password token found")
			return res
				.status(400)
				.json({ success: false, message: "No reset password token found" })
		}

		const storedToken = await prisma.resetPasswordToken.findUnique({
			where: { token },
		})

		if (!storedToken || storedToken.expiresAt < new Date()) {
			logger.error("Reset password token expired or invalid")
			return res.status(400).json({
				success: false,
				message: "Reset password token expired or invalid",
			})
		}

		const user = await prisma.user.findUnique({
			where: { id: storedToken.userId },
		})

		if (!user) {
			logger.error("User not found")
			return res.status(404).json({ success: false, message: "User not found" })
		}

		if (!newPassword) {
			logger.error("New password not provided")
			return res
				.status(400)
				.json({ success: false, message: "New password not provided" })
		}

		const hashedPassword = await argon2.hash(newPassword)

		await prisma.user.update({
			where: { id: user.id },
			data: {
				password: hashedPassword,
				twoFactorCode: null,
				twoFactorExp: null,
			},
		})

		await sendResetSuccessEmail(user.email)

		await prisma.verificationToken.deleteMany({
			where: { userId: user.id },
		})
		
		res.clearCookie("resetPasswordToken")
		logger.info("Password reset successful", { userId: user.id })
		return res.status(200).json({
			success: true,
			message: "Password reset successful",
		})
	} catch (err) {
		logger.error("Error processing password reset", err)
		return res.status(500).json({
			success: false,
			message: err instanceof Error ? err.message : "Internal server error",
		})
	}
}
