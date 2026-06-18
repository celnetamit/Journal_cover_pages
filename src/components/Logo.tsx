type LogoProps = {
  /** Show the "Journal Builder" wordmark next to the mark. */
  withWordmark?: boolean;
  /** Pixel size of the square mark. */
  size?: number;
  className?: string;
};

/** Brand mark: an open journal with an amber bookmark in a slate tile. */
export default function Logo({ withWordmark = true, size = 28, className }: LogoProps) {
  return (
    <span className={`inline-flex items-center gap-2 ${className ?? ""}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        role="img"
        aria-label="Journal Builder"
        className="shrink-0"
      >
        <defs>
          <linearGradient id="jb-mark-bg" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#334155" />
            <stop offset="1" stopColor="#0f172a" />
          </linearGradient>
        </defs>
        <rect width="32" height="32" rx="7" fill="url(#jb-mark-bg)" />
        <path
          d="M16 10.7C12.6 9.1 9.3 8.9 6.2 9.5a1 1 0 0 0-.8 1v10.2a.8.8 0 0 0 1 .8c2.8-.5 5.8-.3 8.9 1.1z"
          fill="#ffffff"
        />
        <path
          d="M16 10.7c3.4-1.6 6.7-1.8 9.8-1.2a1 1 0 0 1 .8 1v10.2a.8.8 0 0 1-1 .8c-2.8-.5-5.8-.3-8.9 1.1z"
          fill="#e2e8f0"
        />
        <g stroke="#0f172a" strokeWidth="1" strokeLinecap="round" opacity=".22">
          <line x1="8.6" y1="13" x2="13.4" y2="13.6" />
          <line x1="8.6" y1="15.6" x2="13.4" y2="16.2" />
          <line x1="8.6" y1="18.2" x2="12.4" y2="18.7" />
          <line x1="18.6" y1="13.6" x2="23.4" y2="13" />
          <line x1="18.6" y1="16.2" x2="23.4" y2="15.6" />
          <line x1="19.6" y1="18.7" x2="23.4" y2="18.2" />
        </g>
        <path d="M19.4 5h3.2v8.6l-1.6-1.7-1.6 1.7z" fill="#f59e0b" />
      </svg>
      {withWordmark && (
        <span className="text-base font-semibold tracking-tight text-slate-900">
          Journal<span className="font-medium text-slate-500">Builder</span>
        </span>
      )}
    </span>
  );
}
