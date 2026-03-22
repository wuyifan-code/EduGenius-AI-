-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "OrderStatus" ADD VALUE 'EVIDENCE_COLLECTING';
ALTER TYPE "OrderStatus" ADD VALUE 'MEMO_GENERATING';

-- AlterTable
ALTER TABLE "escort_profiles" ADD COLUMN     "evidenceCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "last_evidence_at" TIMESTAMP(3),
ADD COLUMN     "trustScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "verificationLevel" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "clinical_pathway_id" TEXT;

-- CreateTable
CREATE TABLE "clinical_pathways" (
    "id" TEXT NOT NULL,
    "disease" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "nodes" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clinical_pathways_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "digital_evidences" (
    "id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "nodeName" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "url" TEXT,
    "content" TEXT,
    "evidenceHash" TEXT,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "validationScore" DOUBLE PRECISION,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "digital_evidences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recovery_memos" (
    "id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "ai_model" TEXT NOT NULL DEFAULT 'minimax',
    "status" TEXT NOT NULL DEFAULT 'generated',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "recovery_memos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transit_stations" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "transit_stations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "digital_evidences_evidenceHash_key" ON "digital_evidences"("evidenceHash");

-- CreateIndex
CREATE INDEX "digital_evidences_order_id_idx" ON "digital_evidences"("order_id");

-- CreateIndex
CREATE INDEX "digital_evidences_evidenceHash_idx" ON "digital_evidences"("evidenceHash");

-- CreateIndex
CREATE UNIQUE INDEX "recovery_memos_order_id_key" ON "recovery_memos"("order_id");

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_clinical_pathway_id_fkey" FOREIGN KEY ("clinical_pathway_id") REFERENCES "clinical_pathways"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "digital_evidences" ADD CONSTRAINT "digital_evidences_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recovery_memos" ADD CONSTRAINT "recovery_memos_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
