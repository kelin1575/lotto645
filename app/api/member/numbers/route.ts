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

    const numbers = await prisma.recommendedNumber.findMany({
      where: { userId },
      include: {
        winningRecords: {
          select: {
            id: true,
            drawNo: true,
            rank: true,
            matchCount: true,
            bonusMatch: true,
            prize: true,
            isChecked: true,
            createdAt: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    const serialised = numbers.map((n) => ({
      ...n,
      winningRecords: n.winningRecords.map((wr) => ({
        ...wr,
        prize: wr.prize.toString(),
      })),
    }))

    return NextResponse.json({ success: true, numbers: serialised })
  } catch (error) {
    console.error('Member numbers GET error:', error)
    return NextResponse.json({ success: false, message: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ success: false, message: '권한이 없습니다.' }, { status: 403 })
    }

    const body = await req.json()
    const { userId, numbers, drawNo } = body

    if (!userId || !Array.isArray(numbers) || numbers.length !== 6) {
      return NextResponse.json(
        { success: false, message: 'userId와 6개의 번호가 필요합니다.' },
        { status: 400 }
      )
    }

    const sorted = [...numbers].sort((a: number, b: number) => a - b)

    const created = await prisma.recommendedNumber.create({
      data: {
        userId,
        drawNo: drawNo || null,
        num1: sorted[0],
        num2: sorted[1],
        num3: sorted[2],
        num4: sorted[3],
        num5: sorted[4],
        num6: sorted[5],
        method: 'MANUAL',
        sentAt: new Date(),
      },
    })

    return NextResponse.json({ success: true, number: created }, { status: 201 })
  } catch (error) {
    console.error('Member numbers POST error:', error)
    return NextResponse.json({ success: false, message: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}
