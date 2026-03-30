import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ success: false, message: '로그인이 필요합니다.' }, { status: 401 })
    }

    const userId = (session.user as any).id

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        credits: true,
        subscriptionStatus: true,
        subscriptionExpiry: true,
        createdAt: true,
        subscriptions: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: {
            id: true,
            startDate: true,
            endDate: true,
            status: true,
          },
        },
        creditTransactions: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          select: {
            id: true,
            amount: true,
            type: true,
            description: true,
            balance: true,
            createdAt: true,
          },
        },
      },
    })

    if (!user) {
      return NextResponse.json({ success: false, message: '사용자를 찾을 수 없습니다.' }, { status: 404 })
    }

    // Determine if subscription is currently active and not expired
    const now = new Date()
    const isSubscriptionActive =
      user.subscriptionStatus === 'ACTIVE' &&
      user.subscriptionExpiry !== null &&
      user.subscriptionExpiry > now

    return NextResponse.json({
      success: true,
      profile: {
        ...user,
        isSubscriptionActive,
      },
    })
  } catch (error) {
    console.error('Member profile GET error:', error)
    return NextResponse.json({ success: false, message: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}
