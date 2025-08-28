import logger from "../utils/logger"
import prisma from "../prismaClient"
import {
	validateTwoFactorCode,
	validateVerificationToken,
} from "../utils/validation"
import { Request, Response } from "express"

export const verifyAccount = async (req: Request, res: Response) => {
	logger.info("Verify account endpoint hit")
	try {
		const token = req.cookies?.verificationToken
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
			logger.error("Verification token validation error", tokenError.details)
			return res
				.status(400)
				.json({ success: false, message: tokenError.details[0].message })
		}

		if (!token) {
			logger.error("No verification token found")
			return res
				.status(400)
				.json({ success: false, message: "No verification token found" })
		}

		const storedToken = await prisma.verificationToken.findUnique({
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

		if (
			user.twoFactorCode !== code ||
			(user.twoFactorExp && user.twoFactorExp < new Date())
		) {
			logger.error("Invalid or expired two-factor code")
			return res
				.status(400)
				.json({ success: false, message: "Invalid or expired two-factor code" })
		}

		await prisma.user.update({
			where: { id: user.id },
			data: {
				isVerified: true,
				twoFactorCode: null,
				twoFactorExp: null,
			},
		})

		res.clearCookie("verificationToken")
		await prisma.verificationToken.deleteMany({
			where: { userId: user.id },
		})

		logger.info("Account verified successfully", { userId: user.id })
		return res
			.status(200)
			.json({ success: true, message: "Account verified successfully" })
	} catch (err) {
		logger.error("Error verifying account", err)
		return res.status(500).json({
			success: false,
			message: err instanceof Error ? err.message : "Internal server error",
		})
	}
}
