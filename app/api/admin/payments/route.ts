import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ success: false, message: '권한이 없습니다.' }, { status: 403 })
    }

    const payments = await prisma.payment.findMany({
      where: { status: 'PENDING' },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            phone: true,
            subscriptionStatus: true,
            createdAt: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ success: true, payments })
  } catch (error) {
    console.error('Admin payments GET error:', error)
    return NextResponse.json({ success: false, message: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ success: false, message: '권한이 없습니다.' }, { status: 403 })
    }

    const body = await req.json()
    const { paymentId, action } = body

    if (!paymentId || !action) {
      return NextResponse.json(
        { success: false, message: 'paymentId와 action이 필요합니다.' },
        { status: 400 }
      )
    }

    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: { user: true },
    })

    if (!payment) {
      return NextResponse.json({ success: false, message: '결제 정보를 찾을 수 없습니다.' }, { status: 404 })
    }

    if (action === 'confirm') {
      const now = new Date()
      const endDate = new Date(now)
      endDate.setDate(endDate.getDate() + 30)

      await prisma.$transaction([
        prisma.payment.update({
          where: { id: paymentId },
          data: { status: 'CONFIRMED', confirmedAt: now },
        }),
        prisma.subscription.create({
          data: {
            userId: payment.userId,
            paymentId: payment.id,
            startDate: now,
            endDate,
            status: 'ACTIVE',
          },
        }),
        prisma.user.update({
          where: { id: payment.userId },
          data: {
            subscriptionStatus: 'ACTIVE',
            subscriptionExpiry: endDate,
          },
        }),
      ])

      return NextResponse.json({
        success: true,
        message: '결제가 승인되었습니다. 구독이 활성화되었습니다.',
      })
    }

    if (action === 'reject') {
      await prisma.payment.update({
        where: { id: paymentId },
        data: { status: 'REJECTED' },
      })

      return NextResponse.json({
        success: true,
        message: '결제가 거절되었습니다.',
      })
    }

    return NextResponse.json(
      { success: false, message: '유효하지 않은 action입니다. confirm 또는 reject를 사용하세요.' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Admin payments PATCH error:', error)
    return NextResponse.json({ success: false, message: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}
