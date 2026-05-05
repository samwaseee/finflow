-- CreateTable
CREATE TABLE "ForecastCache" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "data" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ForecastCache_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ForecastCache_orgId_key" ON "ForecastCache"("orgId");
