import { JwtPayloadType } from "../types/types"
import jwt from "jsonwebtoken"
import logger from "../utils/logger"
import { NextFunction, Request, Response } from "express"

// Extend Express Request interface to include 'user'
declare global {
  namespace Express {
	interface Request {
	  user?: JwtPayloadType
	}
  }
}

export const verifyToken = (
	req: Request,
	res: Response,
	next: NextFunction
) => {
	const token = req.cookies?.accessToken

	if (!token) {
		logger.warn("No token provided - Unauthorized access")
		return res
			.status(401)
			.json({ success: false, message: "Unauthorized access" })
	}

	try {
		if (!process.env.JWT_SECRET) throw new Error("JWT_SECRET not defined")

		const decoded = jwt.verify(token, process.env.JWT_SECRET) as JwtPayloadType

		// Check if the decoded payload is an object and has the expected properties
        if (typeof decoded === 'object' && 'userId' in decoded && 'username' in decoded) {
            req.user = decoded as JwtPayloadType
        } else {
            logger.warn("Invalid token payload")
            return res.status(401).json({ success: false, message: "Unauthorized access" })
        }

		next()
	} catch (error) {
		logger.error("Token verification error", error)
		return res
			.status(401)
			.json({ success: false, message: "Unauthorized access" })
	}
}
