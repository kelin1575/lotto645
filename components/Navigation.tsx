'use client'

import { useSession, signOut } from 'next-auth/react'
import Link from 'next/link'
import { useState } from 'react'

export default function Navigation() {
  const { data: session, status } = useSession()
  const [mobileOpen, setMobileOpen] = useState(false)

  const isAdmin = (session?.user as any)?.role === 'ADMIN'
  const isLoggedIn = status === 'authenticated'

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/' })
  }

  return (
    <header className="bg-gradient-to-r from-red-700 to-red-800 shadow-lg sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl font-black text-yellow-400 tracking-tight drop-shadow">
              🍀 로또픽
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            <NavLink href="/">홈</NavLink>
            <NavLink href="/draws">당첨번호조회</NavLink>

            {!isLoggedIn ? (
              <>
                <NavLink href="/register">회원가입</NavLink>
                <NavLink href="/login">로그인</NavLink>
              </>
            ) : (
              <>
                <NavLink href="/mypage">마이페이지</NavLink>
                {isAdmin && (
                  <NavLink href="/admin">관리자</NavLink>
                )}
                <button
                  onClick={handleSignOut}
                  className="px-4 py-2 text-sm font-medium text-red-100 hover:text-white hover:bg-red-600 rounded-lg transition-colors"
                >
                  로그아웃
                </button>
              </>
            )}
          </nav>

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2 rounded-lg text-red-100 hover:bg-red-600 transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="메뉴 열기"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden border-t border-red-600 py-3 pb-4 space-y-1">
            <MobileNavLink href="/" onClick={() => setMobileOpen(false)}>홈</MobileNavLink>
            <MobileNavLink href="/draws" onClick={() => setMobileOpen(false)}>당첨번호조회</MobileNavLink>

            {!isLoggedIn ? (
              <>
                <MobileNavLink href="/register" onClick={() => setMobileOpen(false)}>회원가입</MobileNavLink>
                <MobileNavLink href="/login" onClick={() => setMobileOpen(false)}>로그인</MobileNavLink>
              </>
            ) : (
              <>
                <MobileNavLink href="/mypage" onClick={() => setMobileOpen(false)}>마이페이지</MobileNavLink>
                {isAdmin && (
                  <MobileNavLink href="/admin" onClick={() => setMobileOpen(false)}>관리자</MobileNavLink>
                )}
                <button
                  onClick={handleSignOut}
                  className="block w-full text-left px-4 py-2 text-sm text-red-100 hover:bg-red-600 rounded-lg transition-colors"
                >
                  로그아웃
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </header>
  )
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="px-4 py-2 text-sm font-medium text-red-100 hover:text-white hover:bg-red-600 rounded-lg transition-colors"
    >
      {children}
    </Link>
  )
}

function MobileNavLink({
  href,
  children,
  onClick,
}: {
  href: string
  children: React.ReactNode
  onClick?: () => void
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="block px-4 py-2 text-sm font-medium text-red-100 hover:bg-red-600 rounded-lg transition-colors"
    >
      {children}
    </Link>
  )
}
