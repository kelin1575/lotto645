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

    const winningRecords = await prisma.winningRecord.findMany({
      where: { userId },
      include: {
        recommendedNumber: {
          select: {
            id: true,
            num1: true,
            num2: true,
            num3: true,
            num4: true,
            num5: true,
            num6: true,
            method: true,
          },
        },
        lotteryDraw: {
          select: {
            drawNo: true,
            drawDate: true,
            num1: true,
            num2: true,
            num3: true,
            num4: true,
            num5: true,
            num6: true,
            bonus: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    const serialised = winningRecords.map((wr) => ({
      ...wr,
      prize: wr.prize.toString(),
    }))

    // Summary stats
    const totalPrize = winningRecords.reduce((acc, wr) => acc + wr.prize, BigInt(0))
    const rankCounts = winningRecords.reduce(
      (acc, wr) => {
        if (wr.rank !== null) {
          acc[wr.rank] = (acc[wr.rank] || 0) + 1
        }
        return acc
      },
      {} as Record<number, number>
    )

    return NextResponse.json({
      success: true,
      winningRecords: serialised,
      summary: {
        totalWins: winningRecords.filter((wr) => wr.rank !== null).length,
        totalPrize: totalPrize.toString(),
        rankCounts,
      },
    })
  } catch (error) {
    console.error('Member winning GET error:', error)
    return NextResponse.json({ success: false, message: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}
