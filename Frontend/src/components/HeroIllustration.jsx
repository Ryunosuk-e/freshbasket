function HeroIllustration(props) {
  return (
    <svg
      viewBox="0 0 640 560"
      role="img"
      aria-label="Illustration of a wicker basket overflowing with fresh produce, with a delivery scooter in the background"
      {...props}
    >
      <defs>
        <linearGradient id="heroBgGrad" x1="0" y1="0" x2="640" y2="560" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#EAF5E8" />
          <stop offset="1" stopColor="#FCF6EA" />
        </linearGradient>
      </defs>

      <rect x="0" y="0" width="640" height="560" rx="32" fill="url(#heroBgGrad)" />

      {/* soft depth circles */}
      <circle cx="540" cy="90" r="120" fill="#FFFFFF" opacity="0.3" />
      <circle cx="70" cy="470" r="150" fill="#3E7A46" opacity="0.07" />
      <circle cx="90" cy="90" r="50" fill="#E8823C" opacity="0.08" />

      {/* delivery scooter silhouette, background */}
      <g opacity="0.5">
        <circle cx="470" cy="430" r="22" fill="none" stroke="#3E7A46" strokeWidth="6" />
        <circle cx="560" cy="430" r="22" fill="none" stroke="#3E7A46" strokeWidth="6" />
        <path
          d="M470,430 L505,430 L525,375 L560,375 M505,430 L520,395"
          fill="none"
          stroke="#3E7A46"
          strokeWidth="6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <rect x="500" y="360" width="34" height="20" rx="6" fill="#3E7A46" />
      </g>

      {/* ground shadow */}
      <ellipse cx="290" cy="486" rx="150" ry="16" fill="#1A1A1A" opacity="0.08" />

      {/* basket handle */}
      <path d="M195,300 C195,230 385,230 385,300" fill="none" stroke="#B8875A" strokeWidth="14" strokeLinecap="round" />

      {/* basket body */}
      <path d="M165,320 L415,320 L390,470 C390,478 165,478 165,470 Z" fill="#D3A671" />
      <path d="M165,320 L415,320 L408,352 L172,352 Z" fill="#C89A6B" />
      {/* weave lines */}
      <path d="M178,368 L402,368 M174,392 L398,392 M180,416 L390,416 M186,440 L384,440 M192,462 L378,462" stroke="#B8875A" strokeWidth="4" opacity="0.6" strokeLinecap="round" />
      <path d="M205,352 L185,470 M245,352 L232,472 M290,352 L290,474 M335,352 L348,472 M375,352 L395,470" stroke="#B8875A" strokeWidth="4" opacity="0.5" strokeLinecap="round" />

      {/* produce overflowing the basket top */}
      {/* leafy greens, back left */}
      <path d="M215,335 C185,290 192,240 225,208 C244,246 237,300 215,335 Z" fill="#4C8C4A" />
      <path d="M240,340 C222,298 227,254 255,228 C270,262 265,308 240,340 Z" fill="#6FAF57" />

      {/* banana bunch, back right */}
      <path d="M400,300 C420,270 445,258 468,260 C458,282 435,296 415,308 Z" fill="#F0C64B" />
      <path d="M395,315 C418,290 445,282 470,288 C458,308 432,318 410,325 Z" fill="#F5D671" />

      {/* orange, top center-right */}
      <circle cx="345" cy="255" r="26" fill="#EE9B3A" />
      <path d="M338,232 C341,225 349,225 352,232" fill="none" stroke="#4C8C4A" strokeWidth="4" strokeLinecap="round" />

      {/* tomato, top center */}
      <circle cx="280" cy="270" r="27" fill="#E4572E" />
      <path d="M272,247 C276,239 284,239 288,247 C282,244 276,244 272,247 Z" fill="#4C8C4A" />

      {/* carrot, front left */}
      <path d="M205,345 L188,412 L235,368 Z" fill="#E8823C" />
      <path d="M198,350 L184,318" stroke="#4C8C4A" strokeWidth="5" strokeLinecap="round" />
      <path d="M206,347 L200,312" stroke="#6FAF57" strokeWidth="5" strokeLinecap="round" />
      <path d="M214,350 L216,316" stroke="#4C8C4A" strokeWidth="5" strokeLinecap="round" />

      {/* grapes, front right */}
      <circle cx="355" cy="330" r="12" fill="#7C5295" />
      <circle cx="378" cy="320" r="12" fill="#8C63A6" />
      <circle cx="372" cy="344" r="12" fill="#7C5295" />
      <circle cx="395" cy="336" r="12" fill="#8C63A6" />
      <circle cx="386" cy="360" r="12" fill="#7C5295" />
      <path d="M372,308 L362,278" stroke="#4C8C4A" strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}

export default HeroIllustration;
