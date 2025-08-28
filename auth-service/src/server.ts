import dotenv from "dotenv"
dotenv.config()

import express from "express"
import helmet from "helmet"
import cors from "cors"
import { RateLimiterRedis } from "rate-limiter-flexible"
import { Redis } from "ioredis"
import { rateLimit } from "express-rate-limit"
import { RedisReply, RedisStore } from "rate-limit-redis"
import cookieParser from "cookie-parser"
import logger from "./utils/logger"
import errorHandler from "./middleware/errorHandler"
import router from "./routes/auth-service"

const app = express()
const PORT = process.env.PORT || 3001

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
app.use(cookieParser())

// IP based rate limiting for sensitive endpoints
const sensitiveEndpointsLimiter = rateLimit({
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

const rateLimiter = new RateLimiterRedis({
	storeClient: redisClient,
	keyPrefix: "middleware",
	points: 10, // 10 requests
	duration: 1, // per 1 second by IP
})

const getIp = (req: express.Request): string => {
	const ip = req.ip || req.headers["x-forwarded-for"]
	if (Array.isArray(ip)) return ip[0]
	return typeof ip === "string" ? ip : "unknown"
}

app.use((req, res, next) => {
	rateLimiter
		.consume(getIp(req))
		.then(() => next())
		.catch(() => {
			logger.warn(`Rate limit exceeded for IP: ${getIp(req)}`)
			return res.status(429).json({
				success: false,
				message: "Too many requests",
			})
		})
})

app.use("/api/auth/register", sensitiveEndpointsLimiter)
app.use("/api/auth", router)
app.use(errorHandler)

app.listen(PORT, () => {
	logger.info(`Auth service running on port ${PORT}`)
})

process.on("unhandledRejection", (reason, promise) => {
	logger.error("Unhandled rejection at:", promise, "reason:", reason)
})
