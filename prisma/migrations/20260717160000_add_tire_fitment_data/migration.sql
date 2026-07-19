-- Add tire-only data structures for vehicle fitment search.
-- This migration is additive and does not modify existing Product rows.

CREATE TABLE "TireProductDetail" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "productId" TEXT NOT NULL,
    "model" TEXT NOT NULL DEFAULT '',
    "secondaryImage" TEXT NOT NULL DEFAULT '',
    "sku" TEXT NOT NULL DEFAULT '',
    "width" INTEGER,
    "aspectRatio" INTEGER,
    "construction" TEXT NOT NULL DEFAULT 'R',
    "rimDiameter" INTEGER,
    "tireSize" TEXT NOT NULL DEFAULT '',
    "loadIndex" TEXT NOT NULL DEFAULT '',
    "speedRating" TEXT NOT NULL DEFAULT '',
    "serviceDescription" TEXT NOT NULL DEFAULT '',
    "season" TEXT NOT NULL DEFAULT '',
    "warrantyMiles" INTEGER,
    "warrantyText" TEXT NOT NULL DEFAULT '',
    "videoUrl" TEXT NOT NULL DEFAULT '',
    "promotionAvailable" BOOLEAN NOT NULL DEFAULT false,
    "promotionText" TEXT NOT NULL DEFAULT '',
    "requestQuoteEnabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "TireProductDetail_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "TireSize" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "width" INTEGER NOT NULL,
    "aspectRatio" INTEGER NOT NULL,
    "construction" TEXT NOT NULL DEFAULT 'R',
    "rimDiameter" INTEGER NOT NULL,
    "displaySize" TEXT NOT NULL,
    "normalizedSize" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

CREATE TABLE "VehicleYear" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "year" INTEGER NOT NULL
);

CREATE TABLE "VehicleMake" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL
);

CREATE TABLE "VehicleModel" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "makeId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    CONSTRAINT "VehicleModel_makeId_fkey" FOREIGN KEY ("makeId") REFERENCES "VehicleMake" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "VehicleOption" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "modelId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    CONSTRAINT "VehicleOption_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "VehicleModel" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "VehicleFitment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "yearId" TEXT NOT NULL,
    "makeId" TEXT NOT NULL,
    "modelId" TEXT NOT NULL,
    "optionId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "VehicleFitment_yearId_fkey" FOREIGN KEY ("yearId") REFERENCES "VehicleYear" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "VehicleFitment_makeId_fkey" FOREIGN KEY ("makeId") REFERENCES "VehicleMake" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "VehicleFitment_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "VehicleModel" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "VehicleFitment_optionId_fkey" FOREIGN KEY ("optionId") REFERENCES "VehicleOption" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE "VehicleFitmentTireSize" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fitmentId" TEXT NOT NULL,
    "tireSizeId" TEXT NOT NULL,
    "position" TEXT NOT NULL DEFAULT 'GENERAL',
    CONSTRAINT "VehicleFitmentTireSize_fitmentId_fkey" FOREIGN KEY ("fitmentId") REFERENCES "VehicleFitment" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "VehicleFitmentTireSize_tireSizeId_fkey" FOREIGN KEY ("tireSizeId") REFERENCES "TireSize" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE "TireProductSize" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "productId" TEXT NOT NULL,
    "tireSizeId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TireProductSize_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TireProductSize_tireSizeId_fkey" FOREIGN KEY ("tireSizeId") REFERENCES "TireSize" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "TireProductDetail_productId_key" ON "TireProductDetail" ("productId");
CREATE UNIQUE INDEX "TireSize_normalizedSize_key" ON "TireSize" ("normalizedSize");
CREATE UNIQUE INDEX "VehicleYear_year_key" ON "VehicleYear" ("year");
CREATE UNIQUE INDEX "VehicleMake_name_key" ON "VehicleMake" ("name");
CREATE UNIQUE INDEX "VehicleModel_makeId_name_key" ON "VehicleModel" ("makeId", "name");
CREATE UNIQUE INDEX "VehicleOption_modelId_name_key" ON "VehicleOption" ("modelId", "name");
CREATE UNIQUE INDEX "VehicleFitment_yearId_makeId_modelId_optionId_key" ON "VehicleFitment" ("yearId", "makeId", "modelId", "optionId");
CREATE UNIQUE INDEX "VehicleFitmentTireSize_fitmentId_tireSizeId_position_key" ON "VehicleFitmentTireSize" ("fitmentId", "tireSizeId", "position");
CREATE UNIQUE INDEX "TireProductSize_productId_tireSizeId_key" ON "TireProductSize" ("productId", "tireSizeId");
