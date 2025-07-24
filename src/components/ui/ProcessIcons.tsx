export const ConsultationIcon = ({ className }: { className?: string }) => (
  <svg 
    className={className} 
    viewBox="0 0 32 32" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Two people consulting */}
    <path 
      d="M10 14C11.6569 14 13 12.6569 13 11C13 9.34315 11.6569 8 10 8C8.34315 8 7 9.34315 7 11C7 12.6569 8.34315 14 10 14Z" 
      stroke="currentColor" 
      strokeWidth="1.5"
    />
    <path 
      d="M22 14C23.6569 14 25 12.6569 25 11C25 9.34315 23.6569 8 22 8C20.3431 8 19 9.34315 19 11C19 12.6569 20.3431 14 22 14Z" 
      stroke="currentColor" 
      strokeWidth="1.5"
    />
    {/* Speech bubble */}
    <path 
      d="M8 18H24C24.5523 18 25 18.4477 25 19V23C25 23.5523 24.5523 24 24 24H17L16 26L15 24H8C7.44772 24 7 23.5523 7 23V19C7 18.4477 7.44772 18 8 18Z" 
      stroke="currentColor" 
      strokeWidth="1.5"
    />
    {/* Dots in speech bubble */}
    <circle cx="12" cy="21" r="0.5" fill="currentColor" />
    <circle cx="16" cy="21" r="0.5" fill="currentColor" />
    <circle cx="20" cy="21" r="0.5" fill="currentColor" />
  </svg>
)

export const DesignIcon = ({ className }: { className?: string }) => (
  <svg 
    className={className} 
    viewBox="0 0 32 32" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Pen/tattoo machine */}
    <path 
      d="M20.707 5.293C21.098 4.902 21.731 4.902 22.121 5.293L26.707 9.879C27.098 10.269 27.098 10.902 26.707 11.293L11.707 26.293C11.519 26.48 11.265 26.587 11 26.587H7C6.448 26.587 6 26.139 6 25.587V21.587C6 21.322 6.105 21.067 6.293 20.879L21.293 5.879" 
      stroke="currentColor" 
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    {/* Pen tip detail */}
    <path 
      d="M18 8L24 14" 
      stroke="currentColor" 
      strokeWidth="1.5"
      strokeLinecap="round"
    />
    {/* Ink drops */}
    <circle cx="8" cy="8" r="1" fill="currentColor" opacity="0.5" />
    <circle cx="12" cy="6" r="0.5" fill="currentColor" opacity="0.3" />
  </svg>
)

export const ExecutionIcon = ({ className }: { className?: string }) => (
  <svg 
    className={className} 
    viewBox="0 0 32 32" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Star/award shape */}
    <path 
      d="M16 4L19.5 11L27 12L21.5 17.5L23 25L16 21L9 25L10.5 17.5L5 12L12.5 11L16 4Z" 
      stroke="currentColor" 
      strokeWidth="1.5"
      strokeLinejoin="round"
    />
    {/* Inner detail */}
    <path 
      d="M16 9L17.5 13H21.5L18.5 15.5L19.5 19.5L16 17L12.5 19.5L13.5 15.5L10.5 13H14.5L16 9Z" 
      fill="currentColor" 
      opacity="0.2"
    />
    {/* Check mark in center */}
    <path 
      d="M13 15L15 17L19 13" 
      stroke="currentColor" 
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)