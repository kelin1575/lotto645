import React from 'react'

type BallSize = 'sm' | 'md' | 'lg'

interface LottoBallProps {
  number: number
  size?: BallSize
  isBonus?: boolean
}

function getBallColor(n: number): string {
  if (n >= 1 && n <= 10) return 'lotto-ball-yellow'
  if (n >= 11 && n <= 20) return 'lotto-ball-blue'
  if (n >= 21 && n <= 30) return 'lotto-ball-red'
  if (n >= 31 && n <= 40) return 'lotto-ball-gray'
  return 'lotto-ball-green'
}

export default function LottoBall({ number, size = 'md', isBonus = false }: LottoBallProps) {
  const colorClass = getBallColor(number)
  const sizeClass = `lotto-ball-${size}`
  const bonusClass = isBonus ? 'lotto-ball-bonus' : ''

  return (
    <span
      className={`lotto-ball ${sizeClass} ${colorClass} ${bonusClass}`}
      aria-label={`번호 ${number}${isBonus ? ' (보너스)' : ''}`}
    >
      {number}
    </span>
  )
}
