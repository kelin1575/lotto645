'use client'

import { useEffect, useState, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import LottoRow from '@/components/LottoRow'

interface Payment {
  id: string
  userId: string
  userName: string
  userEmail: string
  depositorName: string
  amount: number
  status: 'PENDING' | 'CONFIRMED' | 'REJECTED'
  createdAt: string
}

interface Stats {
  activeMemberCount: number
  pendingPaymentCount: number
  totalMemberCount: number
  thisMonthWinners: number
}

interface LatestDraw {
  drawNo: number
  drawDate: string
  numbers: number[]
  bonus: number
}

export default function AdminPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [payments, setPayments] = useState<Payment[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [latestDraw, setLatestDraw] = useState<LatestDraw | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [sendingNumbers, setSendingNumbers] = useState(false)
  const [fetchingDraw, setFetchingDraw] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  const isAdmin = (session?.user as any)?.role === 'ADMIN'

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
      return
    }
    if (status === 'authenticated' && !isAdmin) {
      router.push('/')
    }
  }, [status, isAdmin, router])

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3500)
  }

  const fetchData = useCallback(async () => {
    if (!isAdmin) return
    setLoading(true)
    try {
      const [paymentsRes, drawRes] = await Promise.all([
        fetch('/api/admin/payments'),
        fetch('/api/lottery/draws?page=1&limit=1'),
      ])

      if (paymentsRes.ok) {
        const pData = await paymentsRes.json()
        setPayments(Array.isArray(pData) ? pData : pData.payments ?? [])
        // Derive stats from data if no dedicated stats endpoint
        const activeCount = pData.activeCount ?? pData.stats?.activeMemberCount ?? 0
        const totalCount = pData.totalCount ?? pData.stats?.totalMemberCount ?? 0
        const pendingCount = Array.isArray(pData)
          ? pData.filter((p: Payment) => p.status === 'PENDING').length
          : (pData.payments ?? []).filter((p: Payment) => p.status === 'PENDING').length

        setStats({
          activeMemberCount: activeCount,
          pendingPaymentCount: pendingCount,
          totalMemberCount: totalCount,
          thisMonthWinners: pData.stats?.thisMonthWinners ?? 0,
        })
      }

      if (drawRes.ok) {
        const dData = await drawRes.json()
        if (dData.draws && dData.draws.length > 0) setLatestDraw(dData.draws[0])
      }
    } catch {
      showToast('데이터를 불러오는데 실패했습니다.', 'error')
    } finally {
      setLoading(false)
    }
  }, [isAdmin])

  useEffect(() => {
    if (status === 'authenticated' && isAdmin) {
      fetchData()
    }
  }, [status, isAdmin, fetchData])

  const handlePaymentAction = async (paymentId: string, action: 'confirm' | 'reject') => {
    setActionLoading(paymentId + action)
    try {
      const res = await fetch('/api/admin/payments', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentId, action }),
      })
      if (res.ok) {
        showToast(action === 'confirm' ? '입금이 확인되었습니다.' : '입금이 거절되었습니다.', 'success')
        fetchData()
      } else {
        const d = await res.json()
        showToast(d.message || '처리 실패', 'error')
      }
    } catch {
      showToast('오류가 발생했습니다.', 'error')
    } finally {
      setActionLoading(null)
    }
  }

  const handleSendNumbers = async () => {
    if (!confirm('오늘의 AI 추천번호를 모든 활성 회원에게 발송하시겠습니까?')) return
    setSendingNumbers(true)
    try {
      const res = await fetch('/api/admin/recommend', { method: 'POST' })
      if (res.ok) {
        const d = await res.json()
        showToast(d.message || '추천번호가 발송되었습니다.', 'success')
      } else {
        const d = await res.json()
        showToast(d.message || '발송 실패', 'error')
      }
    } catch {
      showToast('오류가 발생했습니다.', 'error')
    } finally {
      setSendingNumbers(false)
    }
  }

  const handleFetchDraw = async () => {
    if (!confirm('최신 로또 당첨결과를 가져오시겠습니까?')) return
    setFetchingDraw(true)
    try {
      const res = await fetch('/api/lottery/fetch', { method: 'POST' })
      if (res.ok) {
        const d = await res.json()
        showToast(d.message || '최신 당첨결과를 가져왔습니다.', 'success')
        fetchData()
      } else {
        const d = await res.json()
        showToast(d.message || '가져오기 실패', 'error')
      }
    } catch {
      showToast('오류가 발생했습니다.', 'error')
    } finally {
      setFetchingDraw(false)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-red-200 border-t-red-600 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-500">관리자 페이지 로딩 중...</p>
        </div>
      </div>
    )
  }

  if (!isAdmin) return null

  const pendingPayments = payments.filter((p) => p.status === 'PENDING')
  const recentPayments = payments.filter((p) => p.status !== 'PENDING').slice(0, 10)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-20 right-4 z-50 px-5 py-3.5 rounded-xl shadow-xl text-white text-sm font-semibold transition-all ${
            toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'
          }`}
        >
          {toast.type === 'success' ? '✅' : '⚠️'} {toast.message}
        </div>
      )}

      {/* Header */}
      <div className="bg-gradient-to-r from-gray-800 to-gray-900 text-white py-10 px-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black mb-1">관리자 대시보드</h1>
            <p className="text-gray-400 text-sm">로또픽 서비스 관리</p>
          </div>
          <div className="text-right text-sm text-gray-400">
            <p>관리자: <span className="text-white font-semibold">{session?.user?.name}</span></p>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: '활성 회원', value: stats?.activeMemberCount ?? 0, icon: '✅', color: 'green' },
            { label: '전체 회원', value: stats?.totalMemberCount ?? 0, icon: '👥', color: 'blue' },
            { label: '입금 대기', value: pendingPayments.length, icon: '⏳', color: 'yellow' },
            { label: '이번 달 당첨', value: stats?.thisMonthWinners ?? 0, icon: '🏆', color: 'red' },
          ].map((stat) => (
            <div key={stat.label} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <div className="text-2xl mb-2">{stat.icon}</div>
              <p className="text-2xl font-black text-gray-800">{stat.value.toLocaleString()}</p>
              <p className="text-sm text-gray-500 mt-1">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-5 flex items-center gap-2">
            <span>⚡</span> 빠른 작업
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            {/* Send Numbers */}
            <div className="border border-red-200 rounded-xl p-5 bg-red-50">
              <h3 className="font-bold text-red-800 mb-2 flex items-center gap-2">
                <span>🎯</span> 추천번호 발송
              </h3>
              {latestDraw && (
                <div className="mb-3">
                  <p className="text-xs text-gray-500 mb-1">최신 회차: 제 {latestDraw.drawNo}회</p>
                  <LottoRow numbers={latestDraw.numbers} bonus={latestDraw.bonus} showBonus size="sm" />
                </div>
              )}
              <p className="text-sm text-red-700 mb-4">
                모든 활성 구독 회원에게 이번 주 AI 추천번호 5세트를 발송합니다.
              </p>
              <button
                onClick={handleSendNumbers}
                disabled={sendingNumbers}
                className="w-full bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white font-bold py-3 rounded-lg transition-colors"
              >
                {sendingNumbers ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    발송 중...
                  </span>
                ) : (
                  '추천번호 발송하기'
                )}
              </button>
            </div>

            {/* Fetch Latest Draw */}
            <div className="border border-blue-200 rounded-xl p-5 bg-blue-50">
              <h3 className="font-bold text-blue-800 mb-2 flex items-center gap-2">
                <span>🔄</span> 당첨결과 가져오기
              </h3>
              <p className="text-sm text-blue-700 mb-4">
                동행복권 사이트에서 최신 로또 당첨번호를 가져와 데이터베이스에 저장합니다.
              </p>
              <button
                onClick={handleFetchDraw}
                disabled={fetchingDraw}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-bold py-3 rounded-lg transition-colors"
              >
                {fetchingDraw ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    가져오는 중...
                  </span>
                ) : (
                  '최신 당첨결과 가져오기'
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Pending Payments */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-5 flex items-center gap-2">
            <span>⏳</span> 입금 확인 대기
            {pendingPayments.length > 0 && (
              <span className="bg-yellow-400 text-yellow-900 text-xs font-black px-2.5 py-0.5 rounded-full">
                {pendingPayments.length}
              </span>
            )}
          </h2>

          {pendingPayments.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <p className="text-3xl mb-2">✅</p>
              <p className="text-sm">대기 중인 입금이 없습니다.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-gray-500 border-b border-gray-200 text-xs uppercase">
                    <th className="text-left py-3 pr-4 font-semibold">회원</th>
                    <th className="text-left py-3 pr-4 font-semibold">입금자명</th>
                    <th className="text-left py-3 pr-4 font-semibold">금액</th>
                    <th className="text-left py-3 pr-4 font-semibold">신청일</th>
                    <th className="text-right py-3 font-semibold">처리</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {pendingPayments.map((payment) => (
                    <tr key={payment.id} className="hover:bg-yellow-50 transition-colors">
                      <td className="py-3 pr-4">
                        <p className="font-semibold text-gray-800">{payment.userName}</p>
                        <p className="text-xs text-gray-400">{payment.userEmail}</p>
                      </td>
                      <td className="py-3 pr-4 font-semibold text-gray-700">{payment.depositorName}</td>
                      <td className="py-3 pr-4 font-bold text-gray-800">{payment.amount?.toLocaleString() ?? '9,900'}원</td>
                      <td className="py-3 pr-4 text-gray-500 text-xs">{payment.createdAt}</td>
                      <td className="py-3">
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={() => handlePaymentAction(payment.id, 'confirm')}
                            disabled={!!actionLoading}
                            className="bg-green-500 hover:bg-green-600 disabled:bg-green-300 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors"
                          >
                            {actionLoading === payment.id + 'confirm' ? '처리 중...' : '확인'}
                          </button>
                          <button
                            onClick={() => handlePaymentAction(payment.id, 'reject')}
                            disabled={!!actionLoading}
                            className="bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors"
                          >
                            {actionLoading === payment.id + 'reject' ? '처리 중...' : '거절'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Recent Processed Payments */}
        {recentPayments.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-5 flex items-center gap-2">
              <span>📋</span> 최근 처리 내역
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-gray-500 border-b border-gray-200 text-xs uppercase">
                    <th className="text-left py-3 pr-4 font-semibold">회원</th>
                    <th className="text-left py-3 pr-4 font-semibold">입금자명</th>
                    <th className="text-left py-3 pr-4 font-semibold">금액</th>
                    <th className="text-left py-3 pr-4 font-semibold">처리일</th>
                    <th className="text-right py-3 font-semibold">상태</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {recentPayments.map((payment) => (
                    <tr key={payment.id} className="hover:bg-gray-50 transition-colors">
                      <td className="py-3 pr-4">
                        <p className="font-semibold text-gray-800">{payment.userName}</p>
                        <p className="text-xs text-gray-400">{payment.userEmail}</p>
                      </td>
                      <td className="py-3 pr-4 text-gray-700">{payment.depositorName}</td>
                      <td className="py-3 pr-4 font-semibold text-gray-800">{payment.amount?.toLocaleString() ?? '9,900'}원</td>
                      <td className="py-3 pr-4 text-gray-400 text-xs">{payment.createdAt}</td>
                      <td className="py-3 text-right">
                        <span
                          className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                            payment.status === 'CONFIRMED'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-red-100 text-red-600'
                          }`}
                        >
                          {payment.status === 'CONFIRMED' ? '확인됨' : '거절됨'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
