import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { checkAndUpdateWinningRecords, fetchLatestLotteryResult } from '@/lib/lottery'

export async function POST(req: NextRequest) {
  try {
    // Verify cron secret to prevent unauthorized calls
    const authHeader = req.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ success: false, message: '인증 실패.' }, { status: 401 })
    }

    // 1. Fetch the latest lottery result from dhlottery.co.kr
    const fetched = await fetchLatestLotteryResult()
    if (!fetched) {
      return NextResponse.json(
        { success: false, message: '최신 복권 결과를 가져오는 데 실패했습니다.' },
        { status: 502 }
      )
    }

    // 2. Find the latest draw saved in DB
    const latestDraw = await prisma.lotteryDraw.findFirst({
      orderBy: { drawNo: 'desc' },
    })

    if (!latestDraw) {
      return NextResponse.json(
        { success: false, message: 'DB에 복권 회차 정보가 없습니다.' },
        { status: 404 }
      )
    }

    // 3. Check and record winning results for the latest draw
    await checkAndUpdateWinningRecords(latestDraw.drawNo)

    return NextResponse.json({
      success: true,
      message: `${latestDraw.drawNo}회차 당첨 확인이 완료되었습니다.`,
      drawNo: latestDraw.drawNo,
    })
  } catch (error) {
    console.error('Cron check-winners POST error:', error)
    return NextResponse.json({ success: false, message: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}
