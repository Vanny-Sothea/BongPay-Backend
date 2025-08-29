export interface JwtPayload {
  id: string
  username: string
  email: string
  ole: "USER" | "ADMIN"
  iat?: number
  exp?: number
}

export interface Tokens {
  accessToken: string
  refreshToken: string
}

export interface Product {
  id: number
  name: string
  shortDesc: string
  fullDesc?: string | null
  img: string
  rate: number
  originalPrice: number
  stockQuantity: number
  isFeatured: boolean
  discount?: Discount | null
  properties: ProductProperty[]
  variants: Variant[]
  createdAt: Date
  updatedAt: Date
}

export interface Discount {
  id: number
  percentage: number
  discountPrice: number
  productId: number
}

export interface ProductProperty {
  id: number
  propertyName: string
  propertyValues: string[]
  productId: number
}

export interface Variant {
  id: number
  name: string
  img?: string | null
  propertyValues: string[]
  productId: number
}

export type CreateProductInput = Omit<Product, "id" | "createdAt" | "updatedAt" | "discount" | "properties" | "variants">
