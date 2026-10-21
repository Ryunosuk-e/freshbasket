function GroceryIllustration(props) {
  return (
    <svg
      viewBox="0 0 480 600"
      preserveAspectRatio="xMidYMid slice"
      role="img"
      aria-label="Illustration of a paper grocery bag filled with fresh produce"
      {...props}
    >
      <defs>
        <linearGradient id="bagBgGrad" x1="0" y1="0" x2="480" y2="600" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#E7F3E3" />
          <stop offset="1" stopColor="#FCF6EA" />
        </linearGradient>
      </defs>

      <rect x="0" y="0" width="480" height="600" fill="url(#bagBgGrad)" />

      {/* soft depth circles */}
      <circle cx="70" cy="95" r="130" fill="#FFFFFF" opacity="0.25" />
      <circle cx="430" cy="520" r="160" fill="#3E7A46" opacity="0.08" />
      <circle cx="410" cy="90" r="60" fill="#3E7A46" opacity="0.06" />

      {/* ground shadow */}
      <ellipse cx="240" cy="572" rx="112" ry="14" fill="#1A1A1A" opacity="0.08" />

      {/* bag body + fold */}
      <rect x="140" y="372" width="200" height="188" rx="16" fill="#C89A6B" />
      <rect x="156" y="340" width="168" height="48" rx="12" fill="#B8875A" />
      <rect x="156" y="340" width="168" height="8" rx="4" fill="#FFFFFF" opacity="0.15" />
      <rect x="234" y="340" width="8" height="220" fill="#AD7C46" opacity="0.45" />
      <rect x="180" y="372" width="6" height="188" fill="#AD7C46" opacity="0.3" />
      <rect x="296" y="372" width="6" height="188" fill="#AD7C46" opacity="0.3" />

      {/* carrot, back left */}
      <path d="M160,300 L146,235 L184,252 Z" fill="#E8823C" />
      <path d="M150,240 L136,214" stroke="#4C8C4A" strokeWidth="5" strokeLinecap="round" />
      <path d="M156,238 L148,208" stroke="#6FAF57" strokeWidth="5" strokeLinecap="round" />
      <path d="M163,242 L162,212" stroke="#4C8C4A" strokeWidth="5" strokeLinecap="round" />

      {/* grapes, back right */}
      <circle cx="318" cy="270" r="10" fill="#7C5295" />
      <circle cx="334" cy="262" r="10" fill="#8C63A6" />
      <circle cx="330" cy="280" r="10" fill="#7C5295" />
      <circle cx="346" cy="276" r="10" fill="#8C63A6" />
      <circle cx="340" cy="294" r="10" fill="#7C5295" />
      <path d="M330,255 L322,230" stroke="#4C8C4A" strokeWidth="4" strokeLinecap="round" />

      {/* baguette, sticking out upper right */}
      <g transform="rotate(-22 300 260)">
        <rect x="240" y="243" width="140" height="34" rx="17" fill="#E8B96A" />
        <line x1="266" y1="248" x2="258" y2="272" stroke="#C98B44" strokeWidth="4" strokeLinecap="round" />
        <line x1="296" y1="248" x2="288" y2="272" stroke="#C98B44" strokeWidth="4" strokeLinecap="round" />
        <line x1="326" y1="248" x2="318" y2="272" stroke="#C98B44" strokeWidth="4" strokeLinecap="round" />
      </g>

      {/* leafy greens, front left */}
      <path d="M205,345 C182,308 188,265 216,238 C232,270 226,315 205,345 Z" fill="#4C8C4A" />
      <path d="M226,348 C210,312 214,274 238,252 C250,282 246,320 226,348 Z" fill="#6FAF57" />

      {/* tomato, front center */}
      <circle cx="262" cy="312" r="27" fill="#E4572E" />
      <path d="M254,289 C258,281 266,281 270,289 C264,286 258,286 254,289 Z" fill="#4C8C4A" />
    </svg>
  );
}

export default GroceryIllustration;
