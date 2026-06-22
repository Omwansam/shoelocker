import { useStoreSettings } from '../hooks/useStoreSettings.js';
import { formatPrice } from '../utils/format.js';

/** @param {{ subtotal: number, className?: string }} props */
export function FreeShippingNote({ subtotal, className = '' }) {
  const { settings } = useStoreSettings();
  const threshold = Number(settings.free_shipping_threshold) || 0;

  if (!threshold || subtotal <= 0) return null;

  if (subtotal >= threshold) {
    return (
      <p className={`text-xs font-medium text-emerald-700 ${className}`.trim()}>
        You qualify for free shipping on this order.
      </p>
    );
  }

  const remaining = threshold - subtotal;
  return (
    <p className={`text-xs text-neutral-600 ${className}`.trim()}>
      Add {formatPrice(remaining)} more for free shipping in {settings.country}.
    </p>
  );
}
