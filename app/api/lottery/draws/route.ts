import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { fetchLatestLotteryResult } from '@/lib/lottery'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)))
    const skip = (page - 1) * limit

    // Trigger fetch of latest draw in the background if DB is empty or stale
    const latestInDb = await prisma.lotteryDraw.findFirst({
      orderBy: { drawNo: 'desc' },
    })

    const shouldFetch =
      !latestInDb ||
      Date.now() - latestInDb.fetchedAt.getTime() > 1000 * 60 * 60 // older than 1 hour

    if (shouldFetch) {
      // non-blocking – do not await
      fetchLatestLotteryResult().catch((err) =>
        console.error('Background fetch failed:', err)
      )
    }

    const [draws, total] = await Promise.all([
      prisma.lotteryDraw.findMany({
        orderBy: { drawNo: 'desc' },
        skip,
        take: limit,
        select: {
          id: true,
          drawNo: true,
          drawDate: true,
          num1: true,
          num2: true,
          num3: true,
          num4: true,
          num5: true,
          num6: true,
          bonus: true,
          prize1: true,
          winners1: true,
          prize2: true,
          winners2: true,
          prize3: true,
          winners3: true,
          prize4: true,
          winners4: true,
          prize5: true,
          winners5: true,
          fetchedAt: true,
        },
      }),
      prisma.lotteryDraw.count(),
    ])

    // BigInt serialisation: convert to string
    const serialised = draws.map((d) => ({
      ...d,
      prize1: d.prize1.toString(),
      prize2: d.prize2.toString(),
      prize3: d.prize3.toString(),
      prize4: d.prize4.toString(),
      prize5: d.prize5.toString(),
    }))

    return NextResponse.json({
      success: true,
      draws: serialised,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Lottery draws GET error:', error)
    return NextResponse.json({ success: false, message: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}
