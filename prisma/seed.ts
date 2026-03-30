import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

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
    console.log('Admin account created:', adminEmail)
  } else {
    console.log('Admin account already exists:', adminEmail)
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
