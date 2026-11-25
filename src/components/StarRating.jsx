import { useRef, useState } from 'react'

const SIZE_CLASSES = {
  sm: 'size-4',
  md: 'size-6',
  lg: 'size-8',
}

function Apple({ filled }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="75 30 236 230"
      aria-hidden="true"
      className={`size-full pointer-events-none transition-colors duration-150 ${
        filled
          ? 'text-gray-900 dark:text-white'
          : 'text-gray-400/75 dark:text-gray-600'
      }`}
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth={filled ? '7' : '8'}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <g transform="translate(48 16) scale(1.22)">
        <path d="M118 70C108 56 86 50 68 62C42 80 32 108 36 136C42 168 74 192 118 194C162 192 196 168 202 136C206 108 196 80 170 62C152 50 128 56 118 70Z" />
        <path d="M118 66C122 50 132 40 142 34" />
        <path d="M142 34C156 18 186 16 198 30C182 36 158 42 144 40Z" />
      </g>
    </svg>
  )
}

// value: 0–5 (kokonaisluku). Jos onChange annetaan, omenat ovat valittavissa, muuten vain luku.
export default function StarRating({ value = 0, onChange, size = 'md', disabled = false }) {
  const [preview, setPreview] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const containerRef = useRef(null)
  const sizeClass = SIZE_CLASSES[size] || SIZE_CLASSES.md

  // Vain luku -tila
  if (typeof onChange !== 'function') {
    const rounded = Math.round(value)
    return (
      <span
        role="img"
        aria-label={`${value} / 5 omenaa`}
        className="inline-flex gap-1"
      >
        {[1, 2, 3, 4, 5].map((n) => (
          <span key={n} className={sizeClass}>
            <Apple filled={n <= rounded} />
          </span>
        ))}
      </span>
    )
  }

  // Laskee kokonaisluvun 1–5 rivin X-koordinaatista
  const calcRatingFromClientX = (clientX) => {
    const el = containerRef.current
    if (!el) return value || 1

    const rect = el.getBoundingClientRect()
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
    const raw = Math.ceil(ratio * 5)
    return Math.max(1, Math.min(5, raw))
  }

  const handlePointerDown = (e) => {
    if (disabled) return
    if (e.pointerType === 'mouse' && e.button !== 0) return

    e.currentTarget.setPointerCapture(e.pointerId)
    setIsDragging(true)

    const next = calcRatingFromClientX(e.clientX)
    setPreview(next)
    onChange(next)
  }

  const handlePointerMove = (e) => {
    if (disabled) return

    if (isDragging) {
      const next = calcRatingFromClientX(e.clientX)
      setPreview(next)
      if (next !== value) onChange(next)
    } else if (e.pointerType === 'mouse') {
      setPreview(calcRatingFromClientX(e.clientX))
    }
  }

  const handlePointerUp = (e) => {
    if (!isDragging) return
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId)
    }
    setIsDragging(false)
    if (e.pointerType !== 'mouse') {
      setPreview(0)
    }
  }

  const handlePointerLeave = (e) => {
    if (!isDragging && e.pointerType === 'mouse') {
      setPreview(0)
    }
  }

  const handleKeyDown = (e) => {
    if (disabled) return

    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
      e.preventDefault()
      onChange(value === 0 ? 1 : Math.min(5, value + 1))
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
      e.preventDefault()
      onChange(value <= 1 ? 1 : Math.max(1, value - 1))
    } else if (e.key === 'Home') {
      e.preventDefault()
      onChange(1)
    } else if (e.key === 'End') {
      e.preventDefault()
      onChange(5)
    }
  }

  const shown = preview || value

  return (
    <div
      ref={containerRef}
      role="slider"
      tabIndex={disabled ? -1 : 0}
      aria-label="Omenaarvio"
      aria-valuemin={1}
      aria-valuemax={5}
      aria-valuenow={value || 0}
      aria-valuetext={value ? `${value} / 5 omenaa` : 'Ei arviota'}
      aria-disabled={disabled}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onPointerLeave={handlePointerLeave}
      onKeyDown={handleKeyDown}
      className={`inline-flex gap-2 py-1 touch-none select-none rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
        disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'
      }`}
    >
      {[1, 2, 3, 4, 5].map((n) => (
        <span
          key={n}
          className={`${sizeClass} transition-transform ${
            !disabled && shown === n && (isDragging || preview > 0) ? 'scale-110' : ''
          }`}
        >
          <Apple filled={n <= shown} />
        </span>
      ))}
    </div>
  )
}