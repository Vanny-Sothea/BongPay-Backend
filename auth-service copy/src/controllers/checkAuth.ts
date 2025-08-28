import logger from "../utils/logger"
import prisma from "../prismaClient"
import { Request, Response } from "express"

export const checkAuth = async (req: Request, res: Response) => {
	logger.info("Check auth endpoint hit")
	try {
		const accessToken = req.cookies.accessToken
		if (!accessToken) {
			logger.warn("Access token not found")
			return res.status(401).json({
				success: false,
				message: "Access token not found",
			})
		}

		if (!req.user?.userId) {
			logger.error("Invalid token")
			return res.status(401).json({ success: false, message: "Invalid token" })
		}

		const user = await prisma.user.findFirst({
			where: {
				id: req.user.userId,
				isVerified: true,
			},
			select: {
				id: true,
				firstName: true,
				lastName: true,
				email: true,
				role: true,
			},
		})

		if (!user) {
			logger.error("User not found")
			return res.status(404).json({ success: false, message: "User not found" })
		}

		logger.info("User is authenticated", { userId: user.id })
		return res.status(200).json({ success: true, user })
	} catch (err) {
		logger.error("Error checking auth", err)
		return res.status(500).json({
			success: false,
			message: err instanceof Error ? err.message : "Internal server error",
		})
	}
}
