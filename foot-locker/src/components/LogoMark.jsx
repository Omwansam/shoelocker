import { Link } from 'react-router-dom';
import {
  COMPANY_NAME,
  TAGLINE,
  WORDMARK_END,
  WORDMARK_START,
} from '../config/brand.js';

/**
 * @param {{ to?: string, variant?: 'nav' | 'footer' | 'invert', className?: string, showTagline?: boolean, compact?: boolean }} props
 */
export function LogoMark({
  to = '/',
  variant = 'nav',
  className = '',
  showTagline,
  compact,
}) {
  const isInvert = variant === 'invert';
  const isNav = variant === 'nav';
  const showSub = compact ? false : (showTagline ?? (!isInvert && isNav));
  const box = isNav || isInvert ? 'h-8 w-8 text-sm' : 'h-8 w-8 text-sm';
  const title = isNav || isInvert ? 'text-[18px] sm:text-[20px]' : 'text-lg';
  const subtitle = isNav || isInvert ? 'text-[9px] leading-tight' : 'text-[9px]';

  const boxCls = isInvert
    ? 'rounded-lg bg-white font-bold leading-none text-neutral-950'
    : 'rounded-lg bg-neutral-950 font-bold leading-none text-white';
  const stripeCls = 'bg-brand-red';

  const titleCls = isInvert
    ? `font-[800] uppercase tracking-tight text-white [font-stretch:condensed] ${title}`
    : `font-[800] uppercase tracking-tight text-neutral-950 [font-stretch:condensed] ${title}`;

  const inner = (
    <>
      <span
        aria-hidden
        className={`relative flex shrink-0 items-center justify-center ${boxCls} ${box}`}
      >
        S
        <span
          className={`absolute bottom-0 left-0 right-0 h-[3px] rounded-b-lg ${stripeCls}`}
        />
      </span>
      <span className="flex flex-col leading-none">
        <span className={titleCls}>
          {WORDMARK_START}
          <span className="text-brand-red">{WORDMARK_END}</span>
        </span>
        {showSub ? (
          <span
            className={`mt-px font-semibold uppercase tracking-[0.22em] ${isInvert ? 'text-neutral-500' : 'text-neutral-400'} ${subtitle}`}
          >
            {TAGLINE}
          </span>
        ) : null}
      </span>
    </>
  );

  if (!to) {
    return <span className={`flex items-center gap-3 ${className}`}>{inner}</span>;
  }

  return (
    <Link
      to={to}
      className={`flex shrink-0 items-center gap-3 ${className}`}
      aria-label={`${COMPANY_NAME} home`}
    >
      {inner}
    </Link>
  );
}
