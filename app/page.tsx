'use client'

import { useEffect, useState } from 'react'
import LottoRow from '@/components/LottoRow'

interface Draw {
  drawNo: number
  drawDate: string
  numbers: number[]
  bonus: number
}

interface Winner {
  id: string
  rank: number
  userName: string
  numbers: number[]
  bonus?: number
  drawNo: number
  prizeAmount?: number
}

const confettiColors = ['#f59e0b', '#ef4444', '#3b82f6', '#10b981', '#8b5cf6', '#ec4899']

function ConfettiPiece({ color, left, delay, duration }: { color: string; left: number; delay: number; duration: number }) {
  return (
    <div
      className="confetti-piece"
      style={{
        left: `${left}%`,
        backgroundColor: color,
        animationDelay: `${delay}s`,
        animationDuration: `${duration}s`,
        borderRadius: Math.random() > 0.5 ? '50%' : '2px',
      }}
    />
  )
}

export default function HomePage() {
  const [latestDraw, setLatestDraw] = useState<Draw | null>(null)
  const [winners, setWinners] = useState<Winner[]>([])
  const [showConfetti, setShowConfetti] = useState(false)
  const [loadingDraw, setLoadingDraw] = useState(true)
  const [confettiPieces, setConfettiPieces] = useState<Array<{ color: string; left: number; delay: number; duration: number }>>([])

  useEffect(() => {
    // Fetch latest draw
    fetch('/api/lottery/draws?page=1&limit=1')
      .then((r) => r.json())
      .then((data) => {
        if (data.draws && data.draws.length > 0) setLatestDraw(data.draws[0])
      })
      .catch(() => {})
      .finally(() => setLoadingDraw(false))

    // Fetch recent winners
    fetch('/api/public/winners')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setWinners(data)
          const hasTopWinner = data.some((w: Winner) => w.rank <= 3)
          if (hasTopWinner) {
            setShowConfetti(true)
            // Generate confetti pieces
            const pieces = Array.from({ length: 60 }, () => ({
              color: confettiColors[Math.floor(Math.random() * confettiColors.length)],
              left: Math.random() * 100,
              delay: Math.random() * 3,
              duration: 3 + Math.random() * 2,
            }))
            setConfettiPieces(pieces)
            setTimeout(() => setShowConfetti(false), 8000)
          }
        }
      })
      .catch(() => {})
  }, [])

  const rankLabel = (rank: number) => {
    const labels: Record<number, string> = { 1: '1등', 2: '2등', 3: '3등', 4: '4등', 5: '5등' }
    return labels[rank] ?? `${rank}등`
  }

  const rankBadgeColor = (rank: number) => {
    if (rank === 1) return 'bg-yellow-400 text-yellow-900'
    if (rank === 2) return 'bg-gray-300 text-gray-800'
    if (rank === 3) return 'bg-amber-600 text-white'
    return 'bg-gray-100 text-gray-600'
  }

  return (
    <div className="min-h-screen">
      {/* Confetti overlay */}
      {showConfetti && (
        <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
          {confettiPieces.map((p, i) => (
            <ConfettiPiece key={i} {...p} />
          ))}
        </div>
      )}

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-red-700 via-red-600 to-red-800 text-white py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="text-6xl mb-4">🍀</div>
          <h1 className="text-4xl md:text-5xl font-black mb-4 leading-tight">
            AI가 분석한<br />
            <span className="text-yellow-300">로또 추천번호</span>를 받아보세요
          </h1>
          <p className="text-lg md:text-xl text-red-100 mb-8 max-w-2xl mx-auto leading-relaxed">
            빅데이터와 AI 알고리즘으로 분석된 로또 6/45 추천번호.
            매주 토요일 추첨 전 5세트의 번호를 제공해 드립니다.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/register"
              className="bg-yellow-400 text-yellow-900 font-bold px-8 py-4 rounded-full text-lg hover:bg-yellow-300 transition-colors shadow-lg"
            >
              지금 구독하기 →
            </a>
            <a
              href="/draws"
              className="border-2 border-white text-white font-semibold px-8 py-4 rounded-full text-lg hover:bg-white hover:text-red-700 transition-colors"
            >
              당첨번호 조회
            </a>
          </div>
        </div>
      </section>

      {/* Latest Draw Numbers */}
      <section className="bg-white py-12 px-4 border-b border-gray-200">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-center text-gray-800 mb-8">
            최신 당첨번호
          </h2>
          {loadingDraw ? (
            <div className="flex justify-center items-center py-8">
              <div className="w-10 h-10 border-4 border-red-200 border-t-red-600 rounded-full animate-spin" />
            </div>
          ) : latestDraw ? (
            <div className="bg-gradient-to-r from-red-50 to-yellow-50 rounded-2xl p-6 md:p-8 border border-red-100 shadow-sm">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-4">
                <div>
                  <p className="text-sm text-gray-500">제 {latestDraw.drawNo}회</p>
                  <p className="text-gray-600 text-sm">{latestDraw.drawDate}</p>
                </div>
                <LottoRow numbers={latestDraw.numbers} bonus={latestDraw.bonus} showBonus size="lg" />
              </div>
            </div>
          ) : (
            <p className="text-center text-gray-500">당첨번호 정보를 불러올 수 없습니다.</p>
          )}
        </div>
      </section>

      {/* Recent Winners */}
      {winners.length > 0 && (
        <section className="bg-gradient-to-b from-yellow-50 to-white py-12 px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-center text-gray-800 mb-2">
              🎉 최근 당첨자
            </h2>
            <p className="text-center text-gray-500 text-sm mb-8">로또픽 구독 회원 당첨 현황</p>
            <div className="grid gap-4 md:grid-cols-2">
              {winners.map((winner) => (
                <div
                  key={winner.id}
                  className={`rounded-xl p-5 border shadow-sm ${
                    winner.rank <= 3
                      ? 'bg-gradient-to-r from-yellow-50 to-amber-50 border-yellow-200'
                      : 'bg-white border-gray-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${rankBadgeColor(winner.rank)}`}>
                        {rankLabel(winner.rank)}
                      </span>
                      <span className="font-semibold text-gray-700">{winner.userName}</span>
                    </div>
                    {winner.prizeAmount && (
                      <span className="text-sm font-bold text-red-600">
                        {winner.prizeAmount.toLocaleString()}원
                      </span>
                    )}
                  </div>
                  <LottoRow numbers={winner.numbers} bonus={winner.bonus} showBonus={!!winner.bonus} size="sm" />
                  <p className="text-xs text-gray-400 mt-2">제 {winner.drawNo}회 추첨</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Subscription CTA */}
      <section className="bg-red-700 text-white py-16 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <div className="text-5xl mb-4">💎</div>
          <h2 className="text-3xl md:text-4xl font-black mb-4">
            월 <span className="text-yellow-300">9,900원</span>으로<br />
            AI 추천번호를 받아보세요
          </h2>
          <p className="text-red-100 text-lg mb-8 leading-relaxed">
            매주 AI가 분석한 번호 5세트 제공<br />
            5등 2회 미당첨 시 <strong className="text-yellow-300">전액 환불 보장</strong>
          </p>
          <div className="bg-white/10 rounded-2xl p-6 mb-8 inline-block text-left min-w-64">
            <h3 className="font-bold text-yellow-300 mb-3">무통장 입금 안내</h3>
            <div className="space-y-1 text-sm text-red-100">
              <p>은행: <span className="text-white font-semibold">국민은행</span></p>
              <p>계좌: <span className="text-white font-semibold">123-456-789012</span></p>
              <p>예금주: <span className="text-white font-semibold">로또픽(주)</span></p>
              <p>금액: <span className="text-yellow-300 font-bold">9,900원</span></p>
            </div>
          </div>
          <br />
          <a
            href="/register"
            className="bg-yellow-400 text-yellow-900 font-black px-10 py-4 rounded-full text-xl hover:bg-yellow-300 transition-colors shadow-xl inline-block"
          >
            회원가입 후 입금하기 →
          </a>
        </div>
      </section>

      {/* Guarantee Section */}
      <section className="bg-white py-14 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-center text-gray-800 mb-10">
            환불 보장 정책
          </h2>
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-8 text-center shadow-sm">
            <div className="text-5xl mb-4">🛡️</div>
            <h3 className="text-2xl font-black text-green-700 mb-3">
              5등 2회 미당첨 시 전액 환불
            </h3>
            <p className="text-gray-600 leading-relaxed max-w-xl mx-auto">
              구독 기간 중 5등(3개 번호 일치) 이상의 당첨이 2회 발생하지 않을 경우,
              해당 월 구독료 <strong>9,900원을 전액 환불</strong>해 드립니다.
              로또픽의 AI 번호 추천에 자신 있습니다.
            </p>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-gray-50 py-14 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-center text-gray-800 mb-10">
            이용 방법
          </h2>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { step: '01', icon: '📝', title: '회원가입', desc: '이름, 이메일, 연락처를 입력하여 회원가입을 완료하세요.' },
              { step: '02', icon: '💳', title: '무통장 입금', desc: '국민은행 123-456-789012로 월 9,900원을 입금하세요.' },
              { step: '03', icon: '✅', title: '입금 확인', desc: '관리자가 입금을 확인 후 영업일 1일 이내에 구독을 활성화합니다.' },
              { step: '04', icon: '🎯', title: '번호 수령', desc: '매주 토요일 추첨 전 AI 추천번호 5세트를 마이페이지에서 확인하세요.' },
            ].map((item) => (
              <div key={item.step} className="bg-white rounded-xl p-6 text-center shadow-sm border border-gray-100">
                <div className="text-xs font-black text-red-400 mb-2">STEP {item.step}</div>
                <div className="text-4xl mb-3">{item.icon}</div>
                <h3 className="font-bold text-gray-800 mb-2">{item.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="bg-white py-14 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-center text-gray-800 mb-10">
            로또픽의 특별한 서비스
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: '🤖', title: 'AI 빅데이터 분석', desc: '수백 회의 당첨 데이터를 AI가 분석하여 출현 패턴과 통계를 기반으로 번호를 추천합니다.' },
              { icon: '📊', title: '매주 5세트 제공', desc: '다양한 조합의 5세트 번호를 제공하여 당첨 확률을 높입니다.' },
              { icon: '🔔', title: '당첨 자동 확인', desc: '추첨 후 자동으로 당첨 여부를 확인하여 마이페이지에서 바로 확인하실 수 있습니다.' },
            ].map((item) => (
              <div key={item.title} className="rounded-xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                <div className="text-4xl mb-4">{item.icon}</div>
                <h3 className="font-bold text-gray-800 mb-2 text-lg">{item.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
