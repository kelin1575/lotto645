import React from 'react'
import LottoBall from './LottoBall'

type BallSize = 'sm' | 'md' | 'lg'

interface LottoRowProps {
  numbers: number[]
  bonus?: number
  showBonus?: boolean
  size?: BallSize
}

export default function LottoRow({ numbers, bonus, showBonus = false, size = 'md' }: LottoRowProps) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      {numbers.map((num, idx) => (
        <LottoBall key={idx} number={num} size={size} />
      ))}
      {showBonus && bonus !== undefined && (
        <>
          <span className="text-gray-400 font-bold text-lg mx-1">+</span>
          <LottoBall number={bonus} size={size} isBonus />
        </>
      )}
    </div>
  )
}
