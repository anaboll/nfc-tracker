-- Migration: Add Campaign model and campaignId to Tag
-- Run this on the production database before deploying

-- Create Campaign table
CREATE TABLE IF NOT EXISTS "Campaign" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "clientId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Campaign_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Campaign_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Add campaignId column to Tag table
ALTER TABLE "Tag" ADD COLUMN IF NOT EXISTS "campaignId" TEXT;

-- Add foreign key constraint
ALTER TABLE "Tag" ADD CONSTRAINT "Tag_campaignId_fkey"
    FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

-- Create indexes
CREATE INDEX IF NOT EXISTS "Campaign_clientId_idx" ON "Campaign"("clientId");
CREATE INDEX IF NOT EXISTS "Campaign_isActive_idx" ON "Campaign"("isActive");
CREATE INDEX IF NOT EXISTS "Tag_campaignId_idx" ON "Tag"("campaignId");
