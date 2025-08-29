import express from "express"
import { isAdmin, validationToken } from "../middleware/authMiddleware"
import { addProduct, getAllProduct, getProductDetail } from "../controllers/postController"
import upload from "../middleware/upload"

const router = express.Router()

router.get("/ping", (req, res) => {
	res.status(200).json({ message: "PONG" })
})

router.post(
	"/add",
	validationToken,
	isAdmin,
	upload.single("img"),
	addProduct
)

router.get("/all", getAllProduct)
router.get("/:id", getProductDetail)

export default router
