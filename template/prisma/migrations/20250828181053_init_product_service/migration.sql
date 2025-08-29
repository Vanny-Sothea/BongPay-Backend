-- CreateTable
CREATE TABLE "product"."Product" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "shortDesc" TEXT NOT NULL,
    "fullDesc" TEXT,
    "img" TEXT NOT NULL,
    "rate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "originalPrice" DOUBLE PRECISION NOT NULL,
    "stockQuantity" INTEGER NOT NULL,
    "isFeatured" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product"."Discount" (
    "id" SERIAL NOT NULL,
    "percentage" DOUBLE PRECISION NOT NULL,
    "discountPrice" DOUBLE PRECISION NOT NULL,
    "productId" INTEGER NOT NULL,

    CONSTRAINT "Discount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product"."ProductProperty" (
    "id" SERIAL NOT NULL,
    "propertyName" TEXT NOT NULL,
    "propertyValues" TEXT[],
    "productId" INTEGER NOT NULL,

    CONSTRAINT "ProductProperty_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product"."Variant" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "img" TEXT,
    "propertyValues" TEXT[],
    "productId" INTEGER NOT NULL,

    CONSTRAINT "Variant_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Discount_productId_key" ON "product"."Discount"("productId");

-- AddForeignKey
ALTER TABLE "product"."Discount" ADD CONSTRAINT "Discount_productId_fkey" FOREIGN KEY ("productId") REFERENCES "product"."Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product"."ProductProperty" ADD CONSTRAINT "ProductProperty_productId_fkey" FOREIGN KEY ("productId") REFERENCES "product"."Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product"."Variant" ADD CONSTRAINT "Variant_productId_fkey" FOREIGN KEY ("productId") REFERENCES "product"."Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
