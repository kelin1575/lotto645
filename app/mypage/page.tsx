'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import LottoRow from '@/components/LottoRow'

interface Profile {
  id: string
  name: string
  email: string
  phone: string
  role: string
  subscriptionStatus: 'ACTIVE' | 'PENDING' | 'INACTIVE' | 'EXPIRED'
  subscriptionStartDate?: string
  subscriptionEndDate?: string
  credit: number
  depositorName?: string
}

interface RecommendedSet {
  id: string
  setNumber: number
  numbers: number[]
  drawNo: number
  createdAt: string
}

interface WinningRecord {
  id: string
  drawNo: number
  drawDate: string
  numbers: number[]
  rank: number
  prizeAmount: number
  matchCount: number
}

const statusLabel: Record<string, { text: string; className: string }> = {
  ACTIVE: { text: '구독중', className: 'bg-green-100 text-green-700' },
  PENDING: { text: '입금 확인 중', className: 'bg-yellow-100 text-yellow-700' },
  INACTIVE: { text: '미구독', className: 'bg-gray-100 text-gray-500' },
  EXPIRED: { text: '만료', className: 'bg-red-100 text-red-500' },
}

const rankInfo: Record<number, { label: string; className: string }> = {
  1: { label: '1등', className: 'bg-yellow-400 text-yellow-900' },
  2: { label: '2등', className: 'bg-gray-300 text-gray-800' },
  3: { label: '3등', className: 'bg-amber-600 text-white' },
  4: { label: '4등', className: 'bg-blue-100 text-blue-700' },
  5: { label: '5등', className: 'bg-green-100 text-green-700' },
}

export default function MyPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [profile, setProfile] = useState<Profile | null>(null)
  const [recommendations, setRecommendations] = useState<RecommendedSet[]>([])
  const [winnings, setWinnings] = useState<WinningRecord[]>([])
  const [loadingProfile, setLoadingProfile] = useState(true)
  const [loadingRecs, setLoadingRecs] = useState(true)
  const [loadingWins, setLoadingWins] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  useEffect(() => {
    if (status !== 'authenticated') return

    // Fetch profile
    fetch('/api/member/profile')
      .then((r) => r.json())
      .then((d) => setProfile(d))
      .catch(() => setError('프로필을 불러오는데 실패했습니다.'))
      .finally(() => setLoadingProfile(false))

    // Fetch recommendations
    fetch('/api/member/numbers')
      .then((r) => r.json())
      .then((d) => setRecommendations(Array.isArray(d) ? d : d.numbers ?? []))
      .catch(() => {})
      .finally(() => setLoadingRecs(false))

    // Fetch winning history
    fetch('/api/member/winning')
      .then((r) => r.json())
      .then((d) => setWinnings(Array.isArray(d) ? d : d.winnings ?? []))
      .catch(() => {})
      .finally(() => setLoadingWins(false))
  }, [status])

  if (status === 'loading' || loadingProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-red-200 border-t-red-600 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-500">불러오는 중...</p>
        </div>
      </div>
    )
  }

  if (!session) return null

  const sub = profile?.subscriptionStatus ?? 'INACTIVE'
  const isActive = sub === 'ACTIVE'

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-700 to-red-800 text-white py-10 px-4">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-3xl font-black mb-1">마이페이지</h1>
          <p className="text-red-200 text-sm">내 구독 정보와 추천번호를 확인하세요</p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-600 text-sm">
            ⚠️ {error}
          </div>
        )}

        {/* Profile & Subscription */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Profile */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <span>👤</span> 회원 정보
            </h2>
            {profile ? (
              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-500">이름</span>
                  <span className="font-semibold text-gray-800">{profile.name}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-500">이메일</span>
                  <span className="font-semibold text-gray-800">{profile.email}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-500">연락처</span>
                  <span className="font-semibold text-gray-800">{profile.phone || '-'}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-500">입금자명</span>
                  <span className="font-semibold text-gray-800">{profile.depositorName || '-'}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-500">크레딧</span>
                  <span className="font-bold text-yellow-600">{(profile.credit ?? 0).toLocaleString()}원</span>
                </div>
              </div>
            ) : (
              <p className="text-gray-400 text-sm">정보를 불러올 수 없습니다.</p>
            )}
          </div>

          {/* Subscription */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <span>💳</span> 구독 현황
            </h2>
            {profile ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-500 text-sm">구독 상태</span>
                  <span className={`text-sm font-bold px-3 py-1 rounded-full ${statusLabel[sub]?.className ?? 'bg-gray-100 text-gray-500'}`}>
                    {statusLabel[sub]?.text ?? sub}
                  </span>
                </div>
                {profile.subscriptionStartDate && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500 text-sm">시작일</span>
                    <span className="text-sm font-semibold text-gray-700">{profile.subscriptionStartDate}</span>
                  </div>
                )}
                {profile.subscriptionEndDate && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500 text-sm">만료일</span>
                    <span className="text-sm font-semibold text-gray-700">{profile.subscriptionEndDate}</span>
                  </div>
                )}

                {sub === 'PENDING' && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-sm text-yellow-800 mt-2">
                    <p className="font-semibold mb-1">⏳ 입금 확인 중</p>
                    <p>입금 확인 후 영업일 1일 이내에 구독이 활성화됩니다.</p>
                  </div>
                )}

                {(sub === 'INACTIVE' || sub === 'EXPIRED') && (
                  <div className="bg-red-50 border border-red-100 rounded-xl p-4 text-sm text-red-700 mt-2">
                    <p className="font-semibold mb-2">구독이 필요합니다</p>
                    <p className="mb-3">국민은행 123-456-789012 (로또픽(주))로 <strong>9,900원</strong>을 입금하시면 구독이 활성화됩니다.</p>
                    <div className="text-xs text-red-500">입금자명: <strong>{profile.depositorName || '회원가입 시 입력한 이름'}</strong></div>
                  </div>
                )}

                {isActive && (
                  <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-sm text-green-800 mt-2">
                    <p className="font-semibold">✅ 구독 활성화됨</p>
                    <p className="mt-1 text-xs">매주 AI 추천번호 5세트가 제공됩니다.</p>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-gray-400 text-sm">정보를 불러올 수 없습니다.</p>
            )}
          </div>
        </div>

        {/* Recommended Numbers */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-2 flex items-center gap-2">
            <span>🎯</span> 이번 주 추천번호
          </h2>

          {!isActive ? (
            <div className="text-center py-10">
              <div className="text-5xl mb-3">🔒</div>
              <p className="text-gray-500 font-semibold mb-2">구독이 필요합니다</p>
              <p className="text-sm text-gray-400 mb-4">구독 후 AI 추천번호를 확인하실 수 있습니다.</p>
              <div className="inline-block bg-yellow-50 border border-yellow-200 rounded-xl px-6 py-4 text-sm text-yellow-800">
                <p>국민은행 <strong>123-456-789012</strong> (로또픽(주))</p>
                <p className="font-bold text-red-600 text-lg mt-1">월 9,900원</p>
              </div>
            </div>
          ) : loadingRecs ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-8 h-8 border-3 border-red-200 border-t-red-600 rounded-full animate-spin" />
            </div>
          ) : recommendations.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <p className="text-3xl mb-2">📋</p>
              <p className="text-sm">이번 주 추천번호가 아직 발행되지 않았습니다.</p>
            </div>
          ) : (
            <div className="space-y-3 mt-4">
              {recommendations.map((rec) => (
                <div key={rec.id} className="flex items-center gap-4 p-4 bg-gradient-to-r from-red-50 to-yellow-50 rounded-xl border border-red-100">
                  <div className="text-center min-w-12">
                    <span className="text-xs text-gray-400 block">SET</span>
                    <span className="font-black text-red-600 text-lg">{rec.setNumber}</span>
                  </div>
                  <div className="flex-1">
                    <LottoRow numbers={rec.numbers} size="md" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Winning History */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span>🏆</span> 당첨 내역
          </h2>

          {loadingWins ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-8 h-8 border-3 border-red-200 border-t-red-600 rounded-full animate-spin" />
            </div>
          ) : winnings.length === 0 ? (
            <div className="text-center py-10 text-gray-400">
              <p className="text-4xl mb-2">🎰</p>
              <p className="text-sm">아직 당첨 내역이 없습니다.</p>
              <p className="text-xs mt-1">AI 추천번호로 도전해보세요!</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-gray-500 border-b border-gray-200">
                    <th className="text-left py-3 pr-4 font-semibold">회차</th>
                    <th className="text-left py-3 pr-4 font-semibold">추첨일</th>
                    <th className="text-left py-3 pr-4 font-semibold">당첨 등수</th>
                    <th className="text-left py-3 pr-4 font-semibold">번호</th>
                    <th className="text-right py-3 font-semibold">당첨금</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {winnings.map((w) => (
                    <tr key={w.id} className="hover:bg-yellow-50 transition-colors">
                      <td className="py-3 pr-4 font-semibold text-gray-800">{w.drawNo}회</td>
                      <td className="py-3 pr-4 text-gray-500">{w.drawDate}</td>
                      <td className="py-3 pr-4">
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${rankInfo[w.rank]?.className ?? 'bg-gray-100 text-gray-600'}`}>
                          {rankInfo[w.rank]?.label ?? `${w.rank}등`}
                        </span>
                      </td>
                      <td className="py-3 pr-4">
                        <LottoRow numbers={w.numbers} size="sm" />
                      </td>
                      <td className="py-3 text-right font-bold text-red-600">
                        {w.prizeAmount > 0 ? `${w.prizeAmount.toLocaleString()}원` : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Refund Policy */}
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-6">
          <h3 className="font-bold text-green-700 mb-2 flex items-center gap-2">
            <span>🛡️</span> 환불 보장 정책
          </h3>
          <p className="text-sm text-gray-600 leading-relaxed">
            구독 기간 중 5등(3개 번호 일치) 이상의 당첨이 <strong>2회 미발생</strong> 시
            해당 월 구독료 <strong className="text-green-700">9,900원을 전액 환불</strong>해 드립니다.
            환불 문의: <a href="mailto:support@lottopick.kr" className="text-green-700 underline">support@lottopick.kr</a>
          </p>
        </div>
      </div>
    </div>
  )
}
