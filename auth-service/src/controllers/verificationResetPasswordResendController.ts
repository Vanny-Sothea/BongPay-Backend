import logger from "../utils/logger"
import prisma from "../prismaClient"
import { sendVerificationEmail } from "../mail/email"
import { validateVerificationToken } from "../utils/validation"
import { Request, Response } from "express"
import { generateResetPasswordToken } from "../utils/generateToken"
import { User } from "../types/types"

export const verificationResetPasswordResend = async (req: Request, res: Response) => {
	logger.info("Resend verification code request endpoint hit")
	try {
		const token = req.cookies?.resetPasswordToken
		if (!token) {
			logger.error("token not provided")
			return res
				.status(400)
				.json({ success: false, message: "token not provided" })
		}
		const { error } = validateVerificationToken({
			token: token,
		})
		if (error) {
			logger.error("Resend password reset verification code validation error", error.details)
			return res
				.status(400)
				.json({ success: false, message: error.details[0].message })
		}

		const storedToken = await prisma.resetPasswordToken.findUnique({
			where: { token },
		})

		if (!storedToken || storedToken.expiresAt < new Date()) {
			logger.error("Verification token expired or invalid")
			return res.status(400).json({
				success: false,
				message: "Verification token expired or invalid",
			})
		}

		const user = await prisma.user.findUnique({
			where: { id: storedToken.userId },
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
		await sendVerificationEmail(user.email, twoFactorCode)

		logger.info("Resend verification code request successful", {
			userId: user.id,
		})

		return res.status(200).json({
			success: true,
			message: "Resend verification code request successful",
		})
	} catch (err) {
		logger.error("Error processing resend verification code request", err)
		return res.status(500).json({
			success: false,
			message: err instanceof Error ? err.message : "Internal server error",
		})
	}
}
