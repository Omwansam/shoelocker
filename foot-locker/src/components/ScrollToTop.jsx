import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

const HASH_SCROLL_RETRY_MS = 100;
const HASH_SCROLL_MAX_ATTEMPTS = 25;

/**
 * Scroll to top on route change; honour in-page hash targets when present.
 * Retries hash scroll so async pages (e.g. /support articles) can mount first.
 */
export function ScrollToTop() {
  const { pathname, search, hash } = useLocation();
  const attemptRef = useRef(0);

  useEffect(() => {
    attemptRef.current = 0;

    if (!hash) {
      window.scrollTo(0, 0);
      return undefined;
    }

    const id = hash.replace('#', '');
    let timer = 0;

    const scrollToTarget = () => {
      const target = document.getElementById(id);
      if (target) {
        target.scrollIntoView({ block: 'start' });
        return;
      }
      attemptRef.current += 1;
      if (attemptRef.current < HASH_SCROLL_MAX_ATTEMPTS) {
        timer = window.setTimeout(scrollToTarget, HASH_SCROLL_RETRY_MS);
      } else {
        window.scrollTo(0, 0);
      }
    };

    timer = window.setTimeout(scrollToTarget, 0);
    return () => window.clearTimeout(timer);
  }, [pathname, search, hash]);

  return null;
}
