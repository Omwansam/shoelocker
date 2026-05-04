import { useEffect } from 'react';
import { useToast } from '../hooks/useToast.js';
import { CART_ANNOUNCE_EVENT } from '../utils/cartAnnounce.js';

/** Subscribes to cart announce events and mirrors them as toasts (single path). */
export function CartToastBridge() {
  const { show } = useToast();

  useEffect(() => {
    /** @param {Event} e */
    function onAnnounce(e) {
      if (!(e instanceof CustomEvent)) return;
      const d = e.detail;
      if (!d || typeof d !== 'object' || typeof d.name !== 'string') return;
      switch (d.kind) {
        case 'add':
          show(`Added to bag · ${d.name}`, 'success');
          break;
        case 'merge':
          show(`Updated quantity · ${d.name}`, 'success');
          break;
        case 'qty':
          show(`Bag updated · ${d.name}`, 'success');
          break;
        case 'remove':
          show(`Removed · ${d.name}`, 'info');
          break;
        default:
          break;
      }
    }
    globalThis.addEventListener(CART_ANNOUNCE_EVENT, onAnnounce);
    return () => globalThis.removeEventListener(CART_ANNOUNCE_EVENT, onAnnounce);
  }, [show]);

  return null;
}
