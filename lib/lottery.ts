import axios from 'axios'
import { prisma } from './prisma'

// 동행복권 API로 최신 당첨번호 가져오기
export async function fetchLatestLotteryResult() {
  try {
    // 최신 회차 번호 조회 (현재 날짜 기준 계산)
    const latestDrawNo = await getLatestDrawNo()

    for (let i = 0; i < 3; i++) {
      const drawNo = latestDrawNo - i
      const existing = await prisma.lotteryDraw.findUnique({ where: { drawNo } })
      if (!existing) {
        await fetchAndSaveDraw(drawNo)
      }
    }
    return true
  } catch (error) {
    console.error('Failed to fetch lottery result:', error)
    return false
  }
}

export async function getLatestDrawNo(): Promise<number> {
  // 2002년 12월 7일 첫 회차, 매주 토요일 추첨
  const firstDrawDate = new Date('2002-12-07')
  const today = new Date()
  const diffDays = Math.floor((today.getTime() - firstDrawDate.getTime()) / (1000 * 60 * 60 * 24))
  const drawNo = Math.floor(diffDays / 7) + 1
  return drawNo
}

export async function fetchAndSaveDraw(drawNo: number) {
  try {
    const response = await axios.get(
      `https://www.dhlottery.co.kr/common.do?method=getLottoNumber&drwNo=${drawNo}`,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
        timeout: 10000,
      }
    )

    const data = response.data
    if (data.returnValue !== 'success') return null

    const draw = await prisma.lotteryDraw.upsert({
      where: { drawNo },
      update: {
        num1: data.drwtNo1,
        num2: data.drwtNo2,
        num3: data.drwtNo3,
        num4: data.drwtNo4,
        num5: data.drwtNo5,
        num6: data.drwtNo6,
        bonus: data.bnusNo,
        prize1: BigInt(data.firstWinamnt || 0),
        winners1: data.firstPrzwnerCo || 0,
        fetchedAt: new Date(),
      },
      create: {
        drawNo,
        drawDate: new Date(data.drwNoDate),
        num1: data.drwtNo1,
        num2: data.drwtNo2,
        num3: data.drwtNo3,
        num4: data.drwtNo4,
        num5: data.drwtNo5,
        num6: data.drwtNo6,
        bonus: data.bnusNo,
        prize1: BigInt(data.firstWinamnt || 0),
        winners1: data.firstPrzwnerCo || 0,
        prize5: BigInt(5000),
        winners5: 0,
      },
    })

    return draw
  } catch (error) {
    console.error(`Failed to fetch draw ${drawNo}:`, error)
    return null
  }
}

// 당첨 등수 계산
export function calculateRank(
  myNumbers: number[],
  winNumbers: number[],
  bonus: number
): { rank: number | null; matchCount: number; bonusMatch: boolean } {
  const winSet = new Set(winNumbers)
  const matchCount = myNumbers.filter((n) => winSet.has(n)).length
  const bonusMatch = myNumbers.includes(bonus)

  let rank: number | null = null
  if (matchCount === 6) rank = 1
  else if (matchCount === 5 && bonusMatch) rank = 2
  else if (matchCount === 5) rank = 3
  else if (matchCount === 4) rank = 4
  else if (matchCount === 3) rank = 5

  return { rank, matchCount, bonusMatch }
}

// AI 추천번호 생성 (빈도 분석 기반)
export async function generateRecommendedNumbers(count: number = 5): Promise<number[][]> {
  const draws = await prisma.lotteryDraw.findMany({
    orderBy: { drawNo: 'desc' },
    take: 200,
  })

  if (draws.length === 0) {
    return Array.from({ length: count }, () => generateRandomNumbers())
  }

  // 번호별 출현 빈도 계산
  const frequency: Record<number, number> = {}
  for (let i = 1; i <= 45; i++) frequency[i] = 0

  draws.forEach((draw) => {
    ;[draw.num1, draw.num2, draw.num3, draw.num4, draw.num5, draw.num6].forEach((n) => {
      frequency[n]++
    })
  })

  // 최근 10회 출현 번호 (핫넘버)
  const recent = draws.slice(0, 10)
  const hotNumbers = new Set<number>()
  recent.forEach((draw) => {
    ;[draw.num1, draw.num2, draw.num3, draw.num4, draw.num5, draw.num6].forEach((n) => {
      hotNumbers.add(n)
    })
  })

  // 오랫동안 안 나온 번호 (콜드넘버)
  const coldNumbers = new Set<number>()
  const recentAll = new Set<number>()
  draws.slice(0, 5).forEach((draw) => {
    ;[draw.num1, draw.num2, draw.num3, draw.num4, draw.num5, draw.num6].forEach((n) => {
      recentAll.add(n)
    })
  })
  for (let i = 1; i <= 45; i++) {
    if (!recentAll.has(i)) coldNumbers.add(i)
  }

  const result: number[][] = []
  for (let i = 0; i < count; i++) {
    let numbers: number[]
    if (i % 3 === 0) {
      numbers = generateByFrequency(frequency, 'hot')
    } else if (i % 3 === 1) {
      numbers = generateByFrequency(frequency, 'cold')
    } else {
      numbers = generateByFrequency(frequency, 'mixed')
    }
    result.push(numbers)
  }

  return result
}

function generateByFrequency(
  frequency: Record<number, number>,
  mode: 'hot' | 'cold' | 'mixed'
): number[] {
  const entries = Object.entries(frequency).map(([num, freq]) => ({
    num: parseInt(num),
    freq,
  }))

  let pool: number[]
  if (mode === 'hot') {
    pool = entries.sort((a, b) => b.freq - a.freq).slice(0, 25).map((e) => e.num)
  } else if (mode === 'cold') {
    pool = entries.sort((a, b) => a.freq - b.freq).slice(0, 25).map((e) => e.num)
  } else {
    pool = entries.map((e) => e.num)
  }

  const selected: number[] = []
  const available = [...pool]

  while (selected.length < 6 && available.length > 0) {
    const idx = Math.floor(Math.random() * available.length)
    selected.push(available[idx])
    available.splice(idx, 1)
  }

  // 부족하면 나머지에서 채우기
  if (selected.length < 6) {
    const remaining = Array.from({ length: 45 }, (_, i) => i + 1).filter(
      (n) => !selected.includes(n)
    )
    while (selected.length < 6) {
      const idx = Math.floor(Math.random() * remaining.length)
      selected.push(remaining[idx])
      remaining.splice(idx, 1)
    }
  }

  return selected.sort((a, b) => a - b)
}

function generateRandomNumbers(): number[] {
  const numbers: number[] = []
  while (numbers.length < 6) {
    const n = Math.floor(Math.random() * 45) + 1
    if (!numbers.includes(n)) numbers.push(n)
  }
  return numbers.sort((a, b) => a - b)
}

// 당첨번호 자동 확인 및 기록
export async function checkAndUpdateWinningRecords(drawNo: number) {
  const draw = await prisma.lotteryDraw.findUnique({ where: { drawNo } })
  if (!draw) return

  const winNumbers = [draw.num1, draw.num2, draw.num3, draw.num4, draw.num5, draw.num6]
  const unchecked = await prisma.recommendedNumber.findMany({
    where: { isChecked: false, drawNo },
  })

  for (const rec of unchecked) {
    const myNumbers = [rec.num1, rec.num2, rec.num3, rec.num4, rec.num5, rec.num6]
    const { rank, matchCount, bonusMatch } = calculateRank(myNumbers, winNumbers, draw.bonus)

    const prizeMap: Record<number, bigint> = {
      1: draw.prize1,
      2: draw.prize2,
      3: draw.prize3,
      4: draw.prize4,
      5: draw.prize5,
    }

    if (rank !== null) {
      await prisma.winningRecord.create({
        data: {
          userId: rec.userId,
          recommendedNumberId: rec.id,
          drawNo,
          rank,
          matchCount,
          bonusMatch,
          prize: prizeMap[rank] || BigInt(0),
        },
      })
    } else {
      await prisma.winningRecord.create({
        data: {
          userId: rec.userId,
          recommendedNumberId: rec.id,
          drawNo,
          rank: null,
          matchCount,
          bonusMatch: false,
          prize: BigInt(0),
        },
      })
    }

    await prisma.recommendedNumber.update({
      where: { id: rec.id },
      data: { isChecked: true },
    })
  }
}

// 환불 자격 확인 (5등 2회 미만 당첨 시)
export async function checkRefundEligibility(userId: string, subscriptionId: string) {
  const subscription = await prisma.subscription.findUnique({
    where: { id: subscriptionId },
  })
  if (!subscription) return false

  const wins = await prisma.winningRecord.findMany({
    where: {
      userId,
      createdAt: {
        gte: subscription.startDate,
        lte: subscription.endDate,
      },
      rank: { in: [1, 2, 3, 4, 5] },
    },
  })

  // 5등 이상 당첨이 2회 미만이면 환불 자격
  return wins.length < 2
}
