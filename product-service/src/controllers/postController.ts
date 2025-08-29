import { Request, Response } from "express"
import prisma from "../prismaClient"
import logger from "../utils/logger"

export const addProduct = async (req: Request, res: Response) => {
	logger.info("Adding a new product endpoint hit")

	try {
		const {
			name,
			shortDesc,
			fullDesc,
			originalPrice,
			stockQuantity,
			isFeatured,
		} = req.body

		logger.info("Product details received", { name, shortDesc, fullDesc, originalPrice, stockQuantity, isFeatured })
		logger.info("File received", { file: req.file })

		// Cloudinary image URL
		const imgUrl = (req.file as Express.Multer.File)?.path
		if (!imgUrl) {
			logger.warn("No image uploaded for product")
			return res
				.status(400)
				.json({ success: false, message: "Product image is required" })
		}

		logger.info("Product image uploaded successfully", { imgUrl })

		const product = await prisma.product.create({
			data: {
				name,
				shortDesc,
				fullDesc,
				img: imgUrl,
				originalPrice: Number(originalPrice),
				stockQuantity: Number(stockQuantity),
				isFeatured: isFeatured === "true" || isFeatured === true,
			},
		})

		logger.info("Product added successfully", { productId: product.id })
		res.status(201).json({ success: true, product })
	} catch (error) {
		logger.error("Error adding product", { error })
		res.status(500).json({ success: false, message: "Internal Server Error" })
	}
}

export const getAllProduct = async (req: Request, res: Response) => {
	logger.info("Fetching all products")
	try {
		const products = await prisma.product.findMany()
		res.status(200).json({ success: true, products })
	} catch (error) {
		logger.error("Error fetching products", { error })
		res.status(500).json({ success: false, message: "Internal Server Error" })
	}
}

export const getProductDetail = async (req: Request, res: Response) => {
	const productId = Number(req.params.id)
	logger.info("Fetching product details", { productId })

	if (isNaN(productId)) {
		return res
			.status(400)
			.json({ success: false, message: "Invalid product ID" })
	}

	try {
		const product = await prisma.product.findUnique({
			where: { id: productId },
		})

		if (!product) {
			return res
				.status(404)
				.json({ success: false, message: "Product not found" })
		}

		res.status(200).json({ success: true, product })
	} catch (error) {
		logger.error("Error fetching product details", { error })
		res.status(500).json({ success: false, message: "Internal Server Error" })
	}
}
