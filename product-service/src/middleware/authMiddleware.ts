import dotenv from "dotenv"
dotenv.config()

import { Request, Response, NextFunction } from "express"
import jwt from "jsonwebtoken"
import logger from "../utils/logger"
import { JwtPayload } from "../types/types"

export const validationToken = (
	req: Request,
	res: Response,
	next: NextFunction
) => {
	const token =
		req.cookies?.accessToken ||
		(req.headers["authorization"] && req.headers["authorization"].split(" ")[1])

	logger.info("token: ", { token })

	if (!token) {
		logger.warn("Access attempted without valid token!")
		return res.status(401).json({
			success: false,
			message: "Access attempted without valid token!",
		})
	}

	const JWT_SECRET = process.env.JWT_SECRET
	if (!JWT_SECRET) {
		logger.error("JWT_SECRET is not defined")
		return res.status(500).json({
			success: false,
			message: "Internal server error",
		})
	}

	try {
		const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload
		req.user = decoded
		next()
	} catch (err) {
		logger.warn("Invalid token!")
		return res.status(401).json({
			success: false,
			message: "Invalid token!",
		})
	}
}

export const isAdmin = (req: Request, res: Response, next: NextFunction) => {
	if (!req.user) {
		return res.status(401).json({ success: false, message: "Unauthorized" })
	}

	if (req.user.role !== "ADMIN") {
		return res
			.status(403)
			.json({ success: false, message: "Forbidden: Admin only" })
	}

	next()
}
