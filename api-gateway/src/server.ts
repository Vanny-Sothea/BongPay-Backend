import dotenv from "dotenv"
dotenv.config()

import express, { NextFunction, Request, Response } from "express"
import Redis from "ioredis"
import cors from "cors"
import helmet from "helmet"
import { rateLimit } from "express-rate-limit"
import { RedisStore } from "rate-limit-redis"
import type { RedisReply } from "rate-limit-redis"
import proxy from "express-http-proxy"
import logger from "./utils/logger"
import errorHandler from "./middleware/errorHandler"

const app = express()
const PORT = process.env.PORT || 3000

if (!process.env.REDIS_URL) {
	console.error("REDIS_URL is not defined")
	process.exit(1)
}
// const redisClient = new Redis(process.env.REDIS_URL)
const redisClient = new Redis(process.env.REDIS_URL, {
	tls: {
		rejectUnauthorized: false,
	},
})

redisClient.on("connect", () => {
	console.log("Connected to Redis")
})

redisClient.on("error", (err) => {
	console.error("Redis error:", err)
})

const allowedOrigins = [
	"http://localhost:3000",
	"http://localhost:3003",
	"https://bongpay.vercel.app",
	"https://bongpay-vanny-sotheas-projects.vercel.app",
	"https://bongpay-git-main-vanny-sotheas-projects.vercel.app",
	"https://bongpay-9tvadmw5g-vanny-sotheas-projects.vercel.app",
]

const corsOptions = {
	origin: (origin: string | undefined, callback: Function) => {
		if (!origin || allowedOrigins.includes(origin)) {
			callback(null, true)
		} else {
			callback(new Error("Not allowed by CORS"))
		}
	},
	credentials: true,
	allowedHeaders: ["Content-Type", "Authorization"],
	methods: ["GET", "POST", "PUT", "DELETE"],
}

app.use(helmet())
app.use(cors(corsOptions))
app.use(express.json())

const ratelimitOptions = rateLimit({
	windowMs: 15 * 60 * 1000, // 15 Mins
	max: 100, //50 requests
	standardHeaders: true,
	legacyHeaders: false,
	handler: (req, res) => {
		logger.warn(`Sensitive endpoint rate limit exceed for IP: ${req.ip}`)
		return res.status(429).json({
			success: false,
			message: "Too many requests",
		})
	},
	store: new RedisStore({
		sendCommand: (
			command: string,
			...args: (string | Buffer | number)[]
		): Promise<RedisReply> => {
			return redisClient.call(command, ...args) as Promise<RedisReply>
		},
	}),
})

app.use(ratelimitOptions)

app.use((req, res, next) => {
	logger.info(`Received ${req.method} request to ${req.url}`)
	logger.info(`Request body: ${req.body ? JSON.stringify(req.body) : "N/A"}`)

	next()
})

const captureUrl = (req: Request, res: Response, next: NextFunction) => {
	res.locals.proxyUrl = req.originalUrl
	next()
}

const proxyOptions = {
	proxyReqPathResolver: (req: Request) => {
		return req.originalUrl.replace(/^\/v1/, "/api")
	},
	proxyErrorHandler: (err: any, res: Response, next: NextFunction) => {
		const failedUrl = res.locals.proxyUrl || "Unknown URL"

		logger.error(`Proxy error for ${failedUrl}: ${err.message}`)
		logger.error(`Error details: ${JSON.stringify(err, null, 2)}`)

		res.status(500).json({
			message: "Internal server error",
		})
	},
}

if (!process.env.AUTH_SERVICE_URL) {
	console.error("AUTH_SERVICE_URL is not defined")
	process.exit(1)
}

app.use(
	"/v1/auth",
	captureUrl,
	proxy(process.env.AUTH_SERVICE_URL, {
		...proxyOptions,
		proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
			proxyReqOpts.headers["Content-Type"] = "application/json"

			// Forward Authorization header if it exists
			if (srcReq.headers["authorization"]) {
				proxyReqOpts.headers["Authorization"] = srcReq.headers["authorization"]
			}
			return proxyReqOpts
		},
		userResDecorator: (proxyRes, proxyResData, userReq, userRes) => {
			logger.info(`Response received from auth service: ${proxyRes.statusCode}`)
			return proxyResData
		},
	})
)

app.use(errorHandler)
app.get("/ping", (req, res) => {
	res.json({ message: "PONG" })
})

app.listen(PORT, () => {
	logger.info(`API Gateway is running on port ${PORT}`)
	logger.info(`Auth service is running on port ${process.env.AUTH_SERVICE_URL}`)
})
