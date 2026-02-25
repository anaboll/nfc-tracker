-- Add role column to User table (default 'admin' so existing users keep full access)
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "role" TEXT NOT NULL DEFAULT 'admin';

-- Create UserClient junction table
CREATE TABLE IF NOT EXISTS "UserClient" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,

    CONSTRAINT "UserClient_pkey" PRIMARY KEY ("id")
);

-- Add unique constraint
DO $$ BEGIN
    ALTER TABLE "UserClient" ADD CONSTRAINT "UserClient_userId_clientId_key" UNIQUE ("userId", "clientId");
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Add foreign keys
DO $$ BEGIN
    ALTER TABLE "UserClient" ADD CONSTRAINT "UserClient_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE "UserClient" ADD CONSTRAINT "UserClient_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Add indexes
CREATE INDEX IF NOT EXISTS "UserClient_userId_idx" ON "UserClient"("userId");
CREATE INDEX IF NOT EXISTS "UserClient_clientId_idx" ON "UserClient"("clientId");
