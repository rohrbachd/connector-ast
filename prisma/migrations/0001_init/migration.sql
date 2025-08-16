-- Prisma migration for core entities

-- CreateEnum
CREATE TYPE "ParticipantStatus" AS ENUM ('active', 'suspended', 'revoked');

-- CreateEnum
CREATE TYPE "ParticipantRole" AS ENUM ('DataProvider', 'DataConsumer', 'ServiceProvider');

-- CreateEnum
CREATE TYPE "AssetType" AS ENUM ('dataset', 'service');

-- CreateEnum
CREATE TYPE "AssetStatus" AS ENUM ('draft', 'published', 'deprecated', 'archived');

-- CreateTable
CREATE TABLE "participants" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "did" VARCHAR(255) NOT NULL UNIQUE,
  "name" VARCHAR(255) NOT NULL,
  "description" TEXT,
  "homepage_url" VARCHAR(500),
  "roles" "ParticipantRole"[] DEFAULT ARRAY[]::"ParticipantRole"[],
  "status" "ParticipantStatus" NOT NULL DEFAULT 'active',
  "address" JSONB,
  "trust_level" INTEGER DEFAULT 0
);

-- CreateTable
CREATE TABLE "assets" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "external_id" VARCHAR(255) NOT NULL UNIQUE,
  "participant_id" UUID NOT NULL REFERENCES "participants"("id") ON DELETE CASCADE,
  "asset_type" "AssetType" NOT NULL,
  "title" VARCHAR(500) NOT NULL,
  "description" TEXT,
  "version" VARCHAR(50) NOT NULL DEFAULT '1.0.0',
  "status" "AssetStatus" NOT NULL DEFAULT 'draft'
);

-- Indexes
CREATE INDEX "idx_assets_participant" ON "assets"("participant_id");
