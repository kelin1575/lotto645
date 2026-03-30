import "dotenv/config"
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import bcrypt from 'bcryptjs'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@lotto645.com'
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin1234!'

  const existing = await prisma.user.findUnique({ where: { email: adminEmail } })
  if (!existing) {
    const hashed = await bcrypt.hash(adminPassword, 12)
    await prisma.user.create({
      data: {
        email: adminEmail,
        password: hashed,
        name: '관리자',
        role: 'ADMIN',
        subscriptionStatus: 'ACTIVE',
      },
    })
    console.log(`관리자 계정 생성: ${adminEmail}`)
  } else {
    console.log('관리자 계정이 이미 존재합니다.')
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
