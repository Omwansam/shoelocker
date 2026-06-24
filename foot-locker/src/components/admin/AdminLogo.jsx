import { Link } from 'react-router-dom';
import {
  ADMIN_CONSOLE_NAME,
  ADMIN_TAGLINE,
  ADMIN_WORDMARK_END,
  ADMIN_WORDMARK_START,
} from '../../config/adminBrand.js';

/**
 * PulseDesk mark — ascending pulse bars in a gradient tile.
 * @param {{ to?: string, className?: string, showTagline?: boolean, compact?: boolean, size?: 'sm' | 'md', onNavigate?: () => void }} props
 */
export function AdminLogo({
  to = '/admin/dashboard',
  className = '',
  showTagline,
  compact = false,
  size = 'md',
  onNavigate,
}) {
  const showSub = compact ? false : (showTagline ?? true);
  const tile = size === 'sm' ? 'h-8 w-8' : 'h-10 w-10';
  const title = size === 'sm' ? 'text-[17px]' : 'text-[20px] sm:text-[22px]';

  const mark = (
    <span
      aria-hidden
      className={`relative flex shrink-0 items-end justify-center gap-[3px] overflow-hidden rounded-xl bg-gradient-to-br from-neutral-900 via-neutral-950 to-black p-2 shadow-lg shadow-black/50 ${tile}`}
    >
      <span className="h-[35%] w-[4px] rounded-full bg-white/90" />
      <span className="h-[55%] w-[4px] rounded-full bg-white" />
      <span className="h-[80%] w-[4px] rounded-full bg-white" />
      <span className="absolute inset-x-0 bottom-0 h-[3px] bg-brand-red" />
    </span>
  );

  const wordmark = (
    <span className="flex min-w-0 flex-col leading-none">
      <span
        className={`font-[800] uppercase tracking-tight text-white [font-stretch:condensed] ${title}`}
      >
        {ADMIN_WORDMARK_START}
        <span className="text-brand-red">{ADMIN_WORDMARK_END}</span>
      </span>
      {showSub ? (
        <span className="mt-1 text-[9px] font-semibold uppercase tracking-[0.24em] text-neutral-500">
          {ADMIN_TAGLINE}
        </span>
      ) : null}
    </span>
  );

  const inner = (
    <>
      {mark}
      {wordmark}
    </>
  );

  if (!to) {
    return (
      <span className={`flex items-center gap-3 ${className}`} aria-label={ADMIN_CONSOLE_NAME}>
        {inner}
      </span>
    );
  }

  return (
    <Link
      to={to}
      onClick={onNavigate}
      className={`flex shrink-0 items-center gap-3 no-underline ${className}`}
      aria-label={`${ADMIN_CONSOLE_NAME} home`}
    >
      {inner}
    </Link>
  );
}
