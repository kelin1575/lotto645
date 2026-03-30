import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { generateRecommendedNumbers, getLatestDrawNo } from '@/lib/lottery'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ success: false, message: '권한이 없습니다.' }, { status: 403 })
    }

    const activeUsers = await prisma.user.findMany({
      where: {
        subscriptionStatus: 'ACTIVE',
        subscriptionExpiry: { gte: new Date() },
      },
      select: { id: true },
    })

    if (activeUsers.length === 0) {
      return NextResponse.json({
        success: true,
        message: '활성 구독 회원이 없습니다.',
        count: 0,
      })
    }

    const todayDrawNo = await getLatestDrawNo()
    const sentAt = new Date()

    let notifiedCount = 0

    for (const user of activeUsers) {
      const numberSets = await generateRecommendedNumbers(5)

      const data = numberSets.map((nums) => ({
        userId: user.id,
        drawNo: todayDrawNo,
        num1: nums[0],
        num2: nums[1],
        num3: nums[2],
        num4: nums[3],
        num5: nums[4],
        num6: nums[5],
        method: 'AI',
        sentAt,
      }))

      await prisma.recommendedNumber.createMany({ data })
      notifiedCount++
    }

    return NextResponse.json({
      success: true,
      message: `${notifiedCount}명의 회원에게 추천번호가 전송되었습니다.`,
      count: notifiedCount,
      drawNo: todayDrawNo,
    })
  } catch (error) {
    console.error('Admin recommend POST error:', error)
    return NextResponse.json({ success: false, message: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ success: false, message: '권한이 없습니다.' }, { status: 403 })
    }

    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    const todayEnd = new Date()
    todayEnd.setHours(23, 59, 59, 999)

    const recommendations = await prisma.recommendedNumber.findMany({
      where: {
        sentAt: {
          gte: todayStart,
          lte: todayEnd,
        },
      },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    const userCount = new Set(recommendations.map((r) => r.userId)).size

    return NextResponse.json({
      success: true,
      recommendations,
      totalSets: recommendations.length,
      userCount,
    })
  } catch (error) {
    console.error('Admin recommend GET error:', error)
    return NextResponse.json({ success: false, message: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}
