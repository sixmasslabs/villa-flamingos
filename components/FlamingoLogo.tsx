export default function FlamingoLogo({ size = 64, className = '' }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Body */}
      <ellipse cx="52" cy="42" rx="18" ry="22" fill="#C0586E" />
      {/* Neck */}
      <path d="M46 26 Q38 14 44 6 Q50 0 54 8 Q56 16 52 24" fill="#D4748A" stroke="#C0586E" strokeWidth="1" />
      {/* Head */}
      <ellipse cx="52" cy="6" rx="7" ry="6" fill="#D4748A" />
      {/* Beak top */}
      <path d="M56 7 Q66 8 64 11 Q62 13 55 11Z" fill="#C9A96E" />
      {/* Beak bottom (bent) */}
      <path d="M56 10 Q63 12 61 15 Q59 17 54 13Z" fill="#9E7A3E" />
      {/* Eye */}
      <circle cx="54" cy="4" r="1.5" fill="#2C1A22" />
      {/* Wing accent */}
      <path d="M38 38 Q28 44 30 54 Q32 60 42 56" fill="#E8A0B0" stroke="#C0586E" strokeWidth="0.5" />
      {/* Leg 1 */}
      <path d="M48 62 L44 82 L40 86" stroke="#C9A96E" strokeWidth="3" strokeLinecap="round" />
      {/* Leg 2 (bent back - flamingo pose) */}
      <path d="M54 63 L58 72" stroke="#C9A96E" strokeWidth="3" strokeLinecap="round" />
      {/* Foot 1 */}
      <path d="M40 86 L35 88 M40 86 L40 90 M40 86 L45 88" stroke="#C9A96E" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}
