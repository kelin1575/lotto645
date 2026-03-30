'use client'

import { useEffect, useState, useCallback } from 'react'
import LottoRow from '@/components/LottoRow'

interface Draw {
  id: string
  drawNo: number
  drawDate: string
  numbers: number[]
  bonus: number
}

interface DrawsResponse {
  draws: Draw[]
  total: number
  page: number
  totalPages: number
}

const LIMIT = 20

export default function DrawsPage() {
  const [data, setData] = useState<DrawsResponse | null>(null)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchDraws = useCallback(async (p: number) => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/lottery/draws?page=${p}&limit=${LIMIT}`)
      if (!res.ok) throw new Error('데이터를 불러오는데 실패했습니다.')
      const json: DrawsResponse = await res.json()
      setData(json)
    } catch (err) {
      setError(err instanceof Error ? err.message : '오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchDraws(page)
  }, [page, fetchDraws])

  const handlePageChange = (newPage: number) => {
    setPage(newPage)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const renderPagination = () => {
    if (!data || data.totalPages <= 1) return null

    const { totalPages } = data
    const maxVisible = 5
    let start = Math.max(1, page - Math.floor(maxVisible / 2))
    let end = Math.min(totalPages, start + maxVisible - 1)
    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1)
    }

    const pages = Array.from({ length: end - start + 1 }, (_, i) => start + i)

    return (
      <div className="flex items-center justify-center gap-1 mt-8">
        <button
          onClick={() => handlePageChange(1)}
          disabled={page === 1}
          className="px-3 py-2 text-sm rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
          aria-label="처음 페이지"
        >
          «
        </button>
        <button
          onClick={() => handlePageChange(page - 1)}
          disabled={page === 1}
          className="px-3 py-2 text-sm rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
          aria-label="이전 페이지"
        >
          ‹
        </button>

        {pages.map((p) => (
          <button
            key={p}
            onClick={() => handlePageChange(p)}
            className={`px-3.5 py-2 text-sm rounded-lg border transition ${
              p === page
                ? 'bg-red-600 text-white border-red-600 font-bold'
                : 'border-gray-300 text-gray-600 hover:bg-gray-100'
            }`}
          >
            {p}
          </button>
        ))}

        <button
          onClick={() => handlePageChange(page + 1)}
          disabled={page === totalPages}
          className="px-3 py-2 text-sm rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
          aria-label="다음 페이지"
        >
          ›
        </button>
        <button
          onClick={() => handlePageChange(totalPages)}
          disabled={page === totalPages}
          className="px-3 py-2 text-sm rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
          aria-label="마지막 페이지"
        >
          »
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Page header */}
      <div className="bg-gradient-to-r from-red-700 to-red-800 text-white py-10 px-4">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-3xl font-black mb-2">당첨번호 조회</h1>
          <p className="text-red-200 text-sm">로또 6/45 역대 당첨번호를 확인하세요</p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Legend */}
        <div className="bg-white rounded-xl p-4 mb-6 shadow-sm border border-gray-100">
          <p className="text-xs text-gray-500 font-semibold mb-2">번호 색상 안내</p>
          <div className="flex flex-wrap gap-3 text-xs">
            {[
              { label: '1~10', className: 'lotto-ball lotto-ball-sm lotto-ball-yellow' },
              { label: '11~20', className: 'lotto-ball lotto-ball-sm lotto-ball-blue' },
              { label: '21~30', className: 'lotto-ball lotto-ball-sm lotto-ball-red' },
              { label: '31~40', className: 'lotto-ball lotto-ball-sm lotto-ball-gray' },
              { label: '41~45', className: 'lotto-ball lotto-ball-sm lotto-ball-green' },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-1.5">
                <span className={item.className}>{item.label.split('~')[0]}</span>
                <span className="text-gray-500">{item.label}</span>
              </div>
            ))}
            <div className="flex items-center gap-1.5">
              <span className="lotto-ball lotto-ball-sm lotto-ball-yellow lotto-ball-bonus">7</span>
              <span className="text-gray-500">보너스</span>
            </div>
          </div>
        </div>

        {/* Error state */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-600 text-sm mb-6">
            ⚠️ {error}
            <button
              onClick={() => fetchDraws(page)}
              className="ml-3 text-red-700 underline hover:no-underline"
            >
              다시 시도
            </button>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex justify-center items-center py-20">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-red-200 border-t-red-600 rounded-full animate-spin mx-auto mb-3" />
              <p className="text-gray-500 text-sm">불러오는 중...</p>
            </div>
          </div>
        )}

        {/* Table */}
        {!loading && data && (
          <>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              {/* Summary */}
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <p className="text-sm text-gray-500">
                  전체 <strong className="text-gray-800">{data.total.toLocaleString()}</strong>개 회차
                </p>
                <p className="text-xs text-gray-400">
                  {page} / {data.totalPages} 페이지
                </p>
              </div>

              {/* Desktop table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 text-gray-600 text-sm">
                      <th className="text-left px-6 py-3 font-semibold w-24">회차</th>
                      <th className="text-left px-4 py-3 font-semibold w-36">추첨일</th>
                      <th className="text-left px-4 py-3 font-semibold">당첨번호</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {data.draws.map((draw, idx) => (
                      <tr
                        key={draw.id || draw.drawNo}
                        className={`hover:bg-red-50 transition-colors ${idx === 0 && page === 1 ? 'bg-yellow-50' : ''}`}
                      >
                        <td className="px-6 py-4">
                          <span className={`font-bold text-gray-800 ${idx === 0 && page === 1 ? 'text-red-600' : ''}`}>
                            {draw.drawNo}회
                          </span>
                          {idx === 0 && page === 1 && (
                            <span className="ml-2 text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded font-semibold">최신</span>
                          )}
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-500">{draw.drawDate}</td>
                        <td className="px-4 py-4">
                          <LottoRow numbers={draw.numbers} bonus={draw.bonus} showBonus size="sm" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {data.draws.length === 0 && (
                <div className="text-center py-16 text-gray-400">
                  <p className="text-4xl mb-3">📋</p>
                  <p>당첨번호 데이터가 없습니다.</p>
                </div>
              )}
            </div>

            {/* Pagination */}
            {renderPagination()}
          </>
        )}
      </div>
    </div>
  )
}
