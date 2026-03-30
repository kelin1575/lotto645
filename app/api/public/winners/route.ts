import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '10', 10)))

    // Return recent top-rank winning records (rank 1–3) for main page celebration display
    const winners = await prisma.winningRecord.findMany({
      where: {
        rank: { in: [1, 2, 3] },
      },
      include: {
        user: {
          select: {
            // Only expose masked name for privacy
            name: true,
          },
        },
        recommendedNumber: {
          select: {
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
          },
        },
      },
      orderBy: [{ rank: 'asc' }, { createdAt: 'desc' }],
      take: limit,
    })

    const serialised = winners.map((w) => ({
      id: w.id,
      rank: w.rank,
      matchCount: w.matchCount,
      bonusMatch: w.bonusMatch,
      prize: w.prize.toString(),
      createdAt: w.createdAt,
      // Mask user name for privacy: show first char + **
      userName: maskName(w.user.name),
      numbers: w.recommendedNumber,
      draw: w.lotteryDraw,
    }))

    return NextResponse.json({
      success: true,
      winners: serialised,
      total: serialised.length,
    })
  } catch (error) {
    console.error('Public winners GET error:', error)
    return NextResponse.json({ success: false, message: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}

function maskName(name: string): string {
  if (!name || name.length === 0) return '***'
  if (name.length === 1) return name + '**'
  if (name.length === 2) return name[0] + '*'
  return name[0] + '*'.repeat(name.length - 2) + name[name.length - 1]
}
