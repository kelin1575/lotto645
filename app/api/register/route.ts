import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email, name, phone, password, depositorName } = body

    if (!email || !name || !password || !depositorName) {
      return NextResponse.json(
        { success: false, message: '필수 항목을 모두 입력해주세요.' },
        { status: 400 }
      )
    }

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json(
        { success: false, message: '이미 사용 중인 이메일입니다.' },
        { status: 409 }
      )
    }

    const hashedPassword = await bcrypt.hash(password, 12)

    const user = await prisma.user.create({
      data: {
        email,
        name,
        phone: phone || null,
        password: hashedPassword,
        subscriptionStatus: 'PENDING',
      },
    })

    await prisma.payment.create({
      data: {
        userId: user.id,
        amount: 9900,
        status: 'PENDING',
        depositorName,
      },
    })

    return NextResponse.json(
      {
        success: true,
        message:
          '회원가입이 완료되었습니다. 무통장 입금 후 관리자 승인을 기다려주세요.',
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { success: false, message: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
