'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface FormData {
  name: string
  email: string
  phone: string
  password: string
  passwordConfirm: string
  depositorName: string
}

export default function RegisterPage() {
  const router = useRouter()
  const [form, setForm] = useState<FormData>({
    name: '',
    email: '',
    phone: '',
    password: '',
    passwordConfirm: '',
    depositorName: '',
  })
  const [errors, setErrors] = useState<Partial<FormData>>({})
  const [serverError, setServerError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
    setErrors((prev) => ({ ...prev, [name]: '' }))
    setServerError('')
  }

  const validate = (): boolean => {
    const newErrors: Partial<FormData> = {}

    if (!form.name.trim()) newErrors.name = '이름을 입력해주세요.'
    if (!form.email.trim()) {
      newErrors.email = '이메일을 입력해주세요.'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = '올바른 이메일 형식을 입력해주세요.'
    }
    if (!form.phone.trim()) {
      newErrors.phone = '연락처를 입력해주세요.'
    } else if (!/^01[0-9]-?\d{3,4}-?\d{4}$/.test(form.phone.replace(/-/g, ''))) {
      newErrors.phone = '올바른 휴대폰 번호를 입력해주세요. (예: 01012345678)'
    }
    if (!form.password) {
      newErrors.password = '비밀번호를 입력해주세요.'
    } else if (form.password.length < 8) {
      newErrors.password = '비밀번호는 8자 이상이어야 합니다.'
    }
    if (!form.passwordConfirm) {
      newErrors.passwordConfirm = '비밀번호 확인을 입력해주세요.'
    } else if (form.password !== form.passwordConfirm) {
      newErrors.passwordConfirm = '비밀번호가 일치하지 않습니다.'
    }
    if (!form.depositorName.trim()) newErrors.depositorName = '무통장 입금자 명을 입력해주세요.'

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    setLoading(true)
    setServerError('')

    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          phone: form.phone,
          password: form.password,
          depositorName: form.depositorName,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setServerError(data.message || data.error || '회원가입에 실패했습니다.')
      } else {
        setSuccess(true)
      }
    } catch {
      setServerError('서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-yellow-50 flex items-center justify-center px-4 py-12">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8 text-center">
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-2xl font-black text-gray-800 mb-2">회원가입 완료!</h2>
          <p className="text-gray-600 mb-6 leading-relaxed">
            <strong className="text-gray-800">{form.name}</strong>님, 환영합니다!
            <br />
            아래 계좌로 구독료를 입금하시면 서비스가 활성화됩니다.
          </p>

          {/* Bank Transfer Info */}
          <div className="bg-gradient-to-br from-yellow-50 to-amber-50 border-2 border-yellow-300 rounded-2xl p-6 mb-6 text-left">
            <h3 className="font-black text-yellow-800 text-lg mb-4 text-center">💳 무통장 입금 안내</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-yellow-200">
                <span className="text-gray-500 text-sm">은행</span>
                <span className="font-bold text-gray-800">국민은행</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-yellow-200">
                <span className="text-gray-500 text-sm">계좌번호</span>
                <span className="font-bold text-gray-800">123-456-789012</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-yellow-200">
                <span className="text-gray-500 text-sm">예금주</span>
                <span className="font-bold text-gray-800">로또픽(주)</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-yellow-200">
                <span className="text-gray-500 text-sm">입금자명</span>
                <span className="font-bold text-red-600">{form.depositorName}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-gray-500 text-sm">금액</span>
                <span className="font-black text-red-600 text-lg">9,900원</span>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 text-sm text-blue-700">
            <p className="font-semibold mb-1">📌 안내사항</p>
            <ul className="text-left space-y-1 text-xs leading-relaxed">
              <li>• 입금자명을 반드시 <strong>{form.depositorName}</strong>으로 입력해주세요.</li>
              <li>• 입금 확인 후 영업일 기준 1일 이내 구독이 활성화됩니다.</li>
              <li>• 구독 활성화 후 마이페이지에서 추천번호를 확인할 수 있습니다.</li>
            </ul>
          </div>

          <div className="flex flex-col gap-3">
            <button
              onClick={() => router.push('/login')}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3.5 rounded-lg transition-colors"
            >
              로그인하러 가기
            </button>
            <button
              onClick={() => router.push('/')}
              className="w-full border border-gray-300 text-gray-600 font-semibold py-3 rounded-lg hover:bg-gray-50 transition-colors"
            >
              홈으로 돌아가기
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-yellow-50 flex items-center justify-center px-4 py-12">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="text-3xl font-black text-red-600">
            🍀 로또픽
          </Link>
          <h1 className="text-2xl font-bold text-gray-800 mt-4 mb-1">회원가입</h1>
          <p className="text-gray-500 text-sm">AI 로또 번호 추천 서비스에 가입하세요</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          {/* Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-1.5">
              이름 <span className="text-red-500">*</span>
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              value={form.name}
              onChange={handleChange}
              placeholder="홍길동"
              className={`w-full border rounded-lg px-4 py-3 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent transition ${
                errors.name ? 'border-red-400 bg-red-50' : 'border-gray-300'
              }`}
            />
            {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-1.5">
              이메일 <span className="text-red-500">*</span>
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              value={form.email}
              onChange={handleChange}
              placeholder="example@email.com"
              className={`w-full border rounded-lg px-4 py-3 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent transition ${
                errors.email ? 'border-red-400 bg-red-50' : 'border-gray-300'
              }`}
            />
            {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
          </div>

          {/* Phone */}
          <div>
            <label htmlFor="phone" className="block text-sm font-semibold text-gray-700 mb-1.5">
              휴대폰 번호 <span className="text-red-500">*</span>
            </label>
            <input
              id="phone"
              name="phone"
              type="tel"
              required
              value={form.phone}
              onChange={handleChange}
              placeholder="01012345678"
              className={`w-full border rounded-lg px-4 py-3 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent transition ${
                errors.phone ? 'border-red-400 bg-red-50' : 'border-gray-300'
              }`}
            />
            {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
          </div>

          {/* Password */}
          <div>
            <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-1.5">
              비밀번호 <span className="text-red-500">*</span>
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              value={form.password}
              onChange={handleChange}
              placeholder="8자 이상 입력하세요"
              className={`w-full border rounded-lg px-4 py-3 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent transition ${
                errors.password ? 'border-red-400 bg-red-50' : 'border-gray-300'
              }`}
            />
            {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password}</p>}
          </div>

          {/* Password Confirm */}
          <div>
            <label htmlFor="passwordConfirm" className="block text-sm font-semibold text-gray-700 mb-1.5">
              비밀번호 확인 <span className="text-red-500">*</span>
            </label>
            <input
              id="passwordConfirm"
              name="passwordConfirm"
              type="password"
              required
              value={form.passwordConfirm}
              onChange={handleChange}
              placeholder="비밀번호를 다시 입력하세요"
              className={`w-full border rounded-lg px-4 py-3 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent transition ${
                errors.passwordConfirm ? 'border-red-400 bg-red-50' : 'border-gray-300'
              }`}
            />
            {errors.passwordConfirm && <p className="text-xs text-red-500 mt-1">{errors.passwordConfirm}</p>}
          </div>

          {/* Depositor Name */}
          <div>
            <label htmlFor="depositorName" className="block text-sm font-semibold text-gray-700 mb-1.5">
              무통장 입금자 명 <span className="text-red-500">*</span>
            </label>
            <input
              id="depositorName"
              name="depositorName"
              type="text"
              required
              value={form.depositorName}
              onChange={handleChange}
              placeholder="입금 시 사용할 이름을 입력하세요"
              className={`w-full border rounded-lg px-4 py-3 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent transition ${
                errors.depositorName ? 'border-red-400 bg-red-50' : 'border-gray-300'
              }`}
            />
            {errors.depositorName && <p className="text-xs text-red-500 mt-1">{errors.depositorName}</p>}
            <p className="text-xs text-gray-400 mt-1">입금 확인 시 사용되는 이름입니다. 정확히 입력해주세요.</p>
          </div>

          {/* Server Error */}
          {serverError && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-600 flex items-center gap-2">
              <span>⚠️</span> {serverError}
            </div>
          )}

          {/* Subscription info */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-xs text-yellow-800">
            <p className="font-semibold mb-1">💳 구독료 안내</p>
            <p>가입 후 <strong>국민은행 123-456-789012 (로또픽(주))</strong>으로 <strong>월 9,900원</strong>을 입금하시면 구독이 활성화됩니다.</p>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white font-bold py-3.5 rounded-lg transition-colors text-base"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                처리 중...
              </span>
            ) : (
              '회원가입'
            )}
          </button>
        </form>

        <div className="my-6 border-t border-gray-200" />

        <p className="text-center text-sm text-gray-500">
          이미 회원이신가요?{' '}
          <Link href="/login" className="text-red-600 font-semibold hover:text-red-700">
            로그인
          </Link>
        </p>
      </div>
    </div>
  )
}
