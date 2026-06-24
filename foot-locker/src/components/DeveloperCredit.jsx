import { DEVELOPER_STUDIO } from '../config/brand.js';

/**
 * @param {{ className?: string, variant?: 'default' | 'compact' | 'dark' | 'muted' }} props
 */
export function DeveloperCredit({ className = '', variant = 'default' }) {
  const textStyles = {
    default: 'text-xs text-neutral-600',
    compact: 'text-[10px] text-neutral-500',
    dark: 'text-[10px] text-neutral-500',
    muted: 'text-[11px] text-neutral-500',
  };

  const nameStyles = {
    default: 'font-semibold text-neutral-800',
    compact: 'font-semibold text-neutral-700',
    dark: 'font-semibold text-neutral-300',
    muted: 'font-semibold text-neutral-700',
  };

  return (
    <p className={`${textStyles[variant]} ${className}`.trim()}>
      Developed by{' '}
      <span className={nameStyles[variant]}>{DEVELOPER_STUDIO}</span>
    </p>
  );
}
