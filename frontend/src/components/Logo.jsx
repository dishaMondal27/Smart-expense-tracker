export default function LogoSvg({ size = 32 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: 'block', flexShrink: 0 }}
    >
      <rect width="100" height="100" rx="24" fill="#ECFDF5" />
      <path
        d="M28 62L44 46L56 58L72 38"
        stroke="#006948"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="72" cy="38" r="4.5" fill="#006948" />
      <path d="M28 72H72" stroke="#A7F3D0" strokeWidth="4" strokeLinecap="round" />
    </svg>
  )
}
