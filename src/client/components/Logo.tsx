/**
 * A clay tile with three cream bars narrowing as they stack: the system prompt under your
 * instructions under what the session adds. The favicon is the same drawing, so the tab and the
 * page agree.
 */
export const Logo = ({ size = 22 }: { size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 32 32"
    role="img"
    aria-label="claude-context"
    className="shrink-0"
  >
    <rect width="32" height="32" rx="8" fill="var(--color-clay)" />
    <rect x="6" y="8" width="20" height="4.5" rx="2.25" fill="#faf9f5" />
    <rect x="6" y="14.5" width="14" height="4.5" rx="2.25" fill="#faf9f5" fillOpacity="0.85" />
    <rect x="6" y="21" width="8" height="4.5" rx="2.25" fill="#faf9f5" fillOpacity="0.7" />
  </svg>
)
