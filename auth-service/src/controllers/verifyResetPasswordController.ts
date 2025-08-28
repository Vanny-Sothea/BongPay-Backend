import logger from "../utils/logger"
import prisma from "../prismaClient"
import {
	validateTwoFactorCode,
	validateVerificationToken,
} from "../utils/validation"
import { Request, Response } from "express"
import { generateResetPasswordToken } from "../utils/generateToken"
import { User } from "../types/types"


export const verifyResetPassword = async (req: Request, res: Response) => {
	logger.info("Verify account endpoint hit")
	try {
		const token = req.cookies?.resetPasswordToken
		const { code } = req.body

		const { error: twoFactorError } = validateTwoFactorCode({ code: code })
		const { error: tokenError } = validateVerificationToken({
			token: token,
		})

		if (twoFactorError) {
			logger.error("Two-factor code validation error", twoFactorError.details)
			return res
				.status(400)
				.json({ success: false, message: twoFactorError.details[0].message })
		}

		if (tokenError) {
			logger.error("Reset Password token validation error", tokenError.details)
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
			logger.error("Reset Password verification token expired or invalid")
			return res.status(400).json({
				success: false,
				message: "Reset Password verification token expired or invalid",
			})
		}

		const user = await prisma.user.findUnique({
			where: { id: storedToken.userId },
		})

		if (!user) {
			logger.error("User not found")
			return res.status(404).json({ success: false, message: "User not found" })
		}

		if (
			user.twoFactorCode !== code ||
			(user.twoFactorExp && user.twoFactorExp < new Date())
		) {
			logger.error("Invalid or expired two-factor code")
			return res
				.status(400)
				.json({ success: false, message: "Invalid or expired two-factor code" })
		}

		await prisma.resetPasswordToken.deleteMany({
			where: { userId: user.id },
		})
		
        await generateResetPasswordToken(res, user as User)

		logger.info("Account verified successfully ready to reset password", { userId: user.id })
		return res
			.status(200)
			.json({ success: true, message: "Account verified successfully ready to reset password" })
	} catch (err) {
		logger.error("Error verifying account", err)
		return res.status(500).json({
			success: false,
			message: err instanceof Error ? err.message : "Internal server error",
		})
	}
}
