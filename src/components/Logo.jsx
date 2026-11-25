// apple_master-logo inline-SVG:nä.
// Värit käyttävät currentColor-arvoa, joten logo seuraa tekstin väriä (vaalea/tumma teema)
// className-propin väriluokista, esim. "text-gray-900 dark:text-white".

function AppleMark({ strokeWidth }) {
  return (
    <g
      transform="translate(48 16) scale(1.22)"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M118 70C108 56 86 50 68 62C42 80 32 108 36 136C42 168 74 192 118 194C162 192 196 168 202 136C206 108 196 80 170 62C152 50 128 56 118 70Z" />
      <path d="M118 66C122 50 132 40 142 34" />
      <path d="M142 34C156 18 186 16 198 30C182 36 158 42 144 40Z" />
    </g>
  )
}

// collapsed = true: pelkkä omenakuvake (pienennetty sivupalkki, mobiili)

export default function Logo({ collapsed = false, className = '', strokeWidth = 6 }) {
  if (collapsed) {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="80 34 226 226"
        fill="none"
        role="img"
        aria-label="apple_master"
        className={className}
      >
        <AppleMark strokeWidth={strokeWidth} />
      </svg>
    )
  }

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="80 30 830 230"
      fill="none"
      overflow="visible"
      role="img"
      aria-label="apple_master"
      className={className}
    >
      <AppleMark strokeWidth={strokeWidth} />
      <text
        x="390"
        y="172"
        dominantBaseline="middle"
        fill="currentColor"
        fontFamily="Segoe UI, Helvetica Neue, Arial, sans-serif"
        fontSize="100"
        letterSpacing="2"
      >
        apple_master
      </text>
    </svg>
  )
}