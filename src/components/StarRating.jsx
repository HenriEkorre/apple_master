import { useRef, useState } from 'react'

const STAR_PATH =
  'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z'

const SIZE_CLASSES = { sm: 'size-4', md: 'size-6', lg: 'size-8' }

function Star({ filled }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={`size-full pointer-events-none ${
        filled ? 'text-amber-400' : 'text-gray-300 dark:text-gray-600'
      }`}
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinejoin="round"
    >
      <path d={STAR_PATH} />
    </svg>
  )
}

// value: 0–5 (kokonaisluku). Jos onChange annetaan, tähdet ovat valittavissa, muuten vain luku.
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
        aria-label={`${value} / 5 tähteä`}
        className="inline-flex gap-0.5"
      >
        {[1, 2, 3, 4, 5].map((n) => (
          <span key={n} className={sizeClass}>
            <Star filled={n <= rounded} />
          </span>
        ))}
      </span>
    )
  }

  // Laskee kokonaisluvun 1–5 tähtirivin X-koordinaatista
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
      aria-label="Tähtiarvio"
      aria-valuemin={1}
      aria-valuemax={5}
      aria-valuenow={value || 0}
      aria-valuetext={value ? `${value} / 5 tähteä` : 'Ei arviota'}
      aria-disabled={disabled}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onPointerLeave={handlePointerLeave}
      onKeyDown={handleKeyDown}
      className={`inline-flex gap-1.5 py-1 touch-none select-none rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
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
          <Star filled={n <= shown} />
        </span>
      ))}
    </div>
  )
}