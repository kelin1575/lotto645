import type { Metadata } from 'next'
import './globals.css'
import Providers from '@/components/Providers'
import Navigation from '@/components/Navigation'

export const metadata: Metadata = {
  title: '로또픽 - AI 로또 번호 추천',
  description: 'AI가 분석한 로또 6/45 번호 추천 서비스. 월 9,900원으로 매주 추천번호를 받아보세요.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ko" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-gray-50">
        <Providers>
          <Navigation />
          <main className="flex-1">{children}</main>
          <footer className="bg-gray-900 text-gray-300 py-10 mt-auto">
            <div className="max-w-6xl mx-auto px-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
                <div>
                  <h3 className="text-yellow-400 font-black text-xl mb-3">🍀 로또픽</h3>
                  <p className="text-sm text-gray-400 leading-relaxed">
                    AI 기반 로또 번호 추천 서비스.<br />
                    매주 토요일 추첨 전 추천번호를 드립니다.
                  </p>
                </div>
                <div>
                  <h4 className="text-white font-semibold mb-3">무통장 입금 안내</h4>
                  <div className="text-sm space-y-1 text-gray-400">
                    <p>은행: <span className="text-white">국민은행</span></p>
                    <p>계좌번호: <span className="text-white">123-456-789012</span></p>
                    <p>예금주: <span className="text-white">로또픽(주)</span></p>
                    <p>금액: <span className="text-yellow-400 font-bold">월 9,900원</span></p>
                  </div>
                </div>
                <div>
                  <h4 className="text-white font-semibold mb-3">서비스 안내</h4>
                  <ul className="text-sm text-gray-400 space-y-1">
                    <li>• 입금 확인 후 구독 활성화 (영업일 기준 1일)</li>
                    <li>• 5등 2회 미당첨 시 전액 환불 보장</li>
                    <li>• 매주 AI 분석 번호 5세트 제공</li>
                    <li>• 고객센터: support@lottopick.kr</li>
                  </ul>
                </div>
              </div>
              <div className="border-t border-gray-700 pt-6 text-center text-xs text-gray-500">
                <p>© 2026 로또픽. All rights reserved.</p>
                <p className="mt-1">본 서비스는 복권 구매를 권유하지 않으며, 당첨을 보장하지 않습니다.</p>
              </div>
            </div>
          </footer>
        </Providers>
      </body>
    </html>
  )
}
