import multer from "multer"
import { CloudinaryStorage } from "multer-storage-cloudinary"
import cloudinary from "../config/cloudinary"

const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    return {
      folder: "bongpay_products", // folder in cloudinary
      allowed_formats: ["jpg", "jpeg", "png", "webp"],
      public_id: file.originalname.split(".")[0], // file name
    }
  },
})

const upload = multer({ storage })

export default upload
