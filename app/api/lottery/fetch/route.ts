import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { fetchLatestLotteryResult } from '@/lib/lottery'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ success: false, message: '권한이 없습니다.' }, { status: 403 })
    }

    const success = await fetchLatestLotteryResult()

    if (!success) {
      return NextResponse.json(
        { success: false, message: '최신 복권 결과를 가져오는 데 실패했습니다.' },
        { status: 502 }
      )
    }

    return NextResponse.json({
      success: true,
      message: '최신 복권 결과를 성공적으로 가져왔습니다.',
    })
  } catch (error) {
    console.error('Lottery fetch POST error:', error)
    return NextResponse.json({ success: false, message: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}
