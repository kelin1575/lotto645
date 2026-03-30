-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'MEMBER');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('PENDING', 'ACTIVE', 'EXPIRED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'CONFIRMED', 'REJECTED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "CreditType" AS ENUM ('CHARGE', 'REFUND', 'DEDUCT', 'SUBSCRIPTION');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "role" "Role" NOT NULL DEFAULT 'MEMBER',
    "credits" INTEGER NOT NULL DEFAULT 0,
    "subscriptionStatus" "SubscriptionStatus" NOT NULL DEFAULT 'PENDING',
    "subscriptionExpiry" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "depositorName" TEXT NOT NULL,
    "bankRef" TEXT,
    "memo" TEXT,
    "confirmedAt" TIMESTAMP(3),
    "refundedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscriptions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "paymentId" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lottery_draws" (
    "id" TEXT NOT NULL,
    "drawNo" INTEGER NOT NULL,
    "drawDate" TIMESTAMP(3) NOT NULL,
    "num1" INTEGER NOT NULL,
    "num2" INTEGER NOT NULL,
    "num3" INTEGER NOT NULL,
    "num4" INTEGER NOT NULL,
    "num5" INTEGER NOT NULL,
    "num6" INTEGER NOT NULL,
    "bonus" INTEGER NOT NULL,
    "prize1" BIGINT NOT NULL DEFAULT 0,
    "winners1" INTEGER NOT NULL DEFAULT 0,
    "prize2" BIGINT NOT NULL DEFAULT 0,
    "winners2" INTEGER NOT NULL DEFAULT 0,
    "prize3" BIGINT NOT NULL DEFAULT 0,
    "winners3" INTEGER NOT NULL DEFAULT 0,
    "prize4" BIGINT NOT NULL DEFAULT 0,
    "winners4" INTEGER NOT NULL DEFAULT 0,
    "prize5" BIGINT NOT NULL DEFAULT 0,
    "winners5" INTEGER NOT NULL DEFAULT 0,
    "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lottery_draws_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recommended_numbers" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "drawNo" INTEGER,
    "num1" INTEGER NOT NULL,
    "num2" INTEGER NOT NULL,
    "num3" INTEGER NOT NULL,
    "num4" INTEGER NOT NULL,
    "num5" INTEGER NOT NULL,
    "num6" INTEGER NOT NULL,
    "method" TEXT NOT NULL DEFAULT 'AI',
    "sentAt" TIMESTAMP(3),
    "isChecked" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "recommended_numbers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "winning_records" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "recommendedNumberId" TEXT NOT NULL,
    "drawNo" INTEGER NOT NULL,
    "rank" INTEGER,
    "matchCount" INTEGER NOT NULL,
    "bonusMatch" BOOLEAN NOT NULL DEFAULT false,
    "prize" BIGINT NOT NULL DEFAULT 0,
    "isChecked" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "winning_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "credit_transactions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "type" "CreditType" NOT NULL,
    "description" TEXT NOT NULL,
    "balance" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "credit_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_notices" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "isPinned" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admin_notices_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "subscriptions_paymentId_key" ON "subscriptions"("paymentId");

-- CreateIndex
CREATE UNIQUE INDEX "lottery_draws_drawNo_key" ON "lottery_draws"("drawNo");

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "payments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recommended_numbers" ADD CONSTRAINT "recommended_numbers_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "winning_records" ADD CONSTRAINT "winning_records_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "winning_records" ADD CONSTRAINT "winning_records_recommendedNumberId_fkey" FOREIGN KEY ("recommendedNumberId") REFERENCES "recommended_numbers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "winning_records" ADD CONSTRAINT "winning_records_drawNo_fkey" FOREIGN KEY ("drawNo") REFERENCES "lottery_draws"("drawNo") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "credit_transactions" ADD CONSTRAINT "credit_transactions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
