const MobileMoney = () => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      height="20"
      width="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* Phone outline */}
      <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
      <line x1="12" y1="18" x2="12.01" y2="18" />
      {/* Money symbol */}
      <path d="M12 6v2m0 4v2" />
      <path d="M9 10h6" />
      <path d="M9 12h6" />
    </svg>
  )
}

export default MobileMoney
