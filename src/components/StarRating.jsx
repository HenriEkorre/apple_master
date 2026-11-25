import { useRef, useState } from 'react'

const STAR_PATH =
  'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z'

const SIZE_CLASSES = { sm: 'size-4', md: 'size-6', lg: 'size-8' }

function Star({ filled }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={`size-full ${
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

// value: 0–5. Jos onChange annetaan, tähdet ovat valittavissa, muuten vain luku.
export default function StarRating({ value = 0, onChange, size = 'md', disabled = false }) {
  const [hover, setHover] = useState(0)
  const buttonRefs = useRef([])
  const sizeClass = SIZE_CLASSES[size] || SIZE_CLASSES.md

  // Vain luku -tila (esim. arvostelulistassa)
  if (typeof onChange !== 'function') {
    return (
      <span
        role="img"
        aria-label={`${value} / 5 tähteä`}
        className="inline-flex gap-0.5"
      >
        {[1, 2, 3, 4, 5].map((n) => (
          <span key={n} className={sizeClass}>
            <Star filled={n <= value} />
          </span>
        ))}
      </span>
    )
  }

  // Hiiren esikatselu näkyy, kunnes hiiri poistuu tähdiltä
  const shown = hover || value

  const select = (n) => {
    onChange(n)
    buttonRefs.current[n - 1]?.focus()
  }

  const handleKeyDown = (e) => {
    if (disabled) return

    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
      e.preventDefault()
      select(Math.min(5, value + 1))
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
      e.preventDefault()
      select(Math.max(1, value - 1))
    }
  }

  return (
    <div
      role="radiogroup"
      aria-label="Tähtiarvio"
      className="inline-flex gap-1"
      onMouseLeave={() => setHover(0)}
      onKeyDown={handleKeyDown}
    >
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          ref={(el) => (buttonRefs.current[n - 1] = el)}
          type="button"
          role="radio"
          aria-checked={value === n}
          aria-label={`${n} ${n === 1 ? 'tähti' : 'tähteä'}`}
          disabled={disabled}
          tabIndex={value === n || (value === 0 && n === 1) ? 0 : -1}
          onClick={() => onChange(n)}
          onMouseEnter={() => setHover(n)}
          className={`${sizeClass} cursor-pointer transition-transform hover:scale-110 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-60`}
        >
          <Star filled={n <= shown} />
        </button>
      ))}
    </div>
  )
}