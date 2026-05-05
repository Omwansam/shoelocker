const CHANGE = 'shoelocker-newsletter-changed';
/** @type {NewsletterEntry[]} */
let memorySubscribers = [];

/**
 * @typedef {{ email: string, subscribedAt: string }} NewsletterEntry
 */

function emitChange() {
  try {
    globalThis.dispatchEvent(new CustomEvent(CHANGE));
  } catch {
    //
  }
}

/** @returns {NewsletterEntry[]} */
export function readNewsletterSubscribers() {
  return memorySubscribers;
}

/** @param {NewsletterEntry[]} rows */
function writeNewsletterSubscribers(rows) {
  memorySubscribers = rows;
  emitChange();
}

/**
 * @param {string} emailRaw
 * @returns {{ ok: true, already: boolean, email: string } | { ok: false, error: string }}
 */
export function persistNewsletterSignup(emailRaw) {
  const email = emailRaw.trim().toLowerCase();
  if (!email) return { ok: false, error: 'Enter an email address.' };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, error: 'That does not look like a valid email.' };
  }
  const list = readNewsletterSubscribers();
  if (list.some((r) => r.email === email)) {
    return { ok: true, already: true, email };
  }
  const next = [
    { email, subscribedAt: new Date().toISOString() },
    ...list,
  ].slice(0, 500);
  writeNewsletterSubscribers(next);
  return { ok: true, already: false, email };
}

export function subscribeNewsletterChange(cb) {
  if (typeof globalThis.addEventListener !== 'function') return () => {};
  const handler = () => cb();
  globalThis.addEventListener(CHANGE, handler);
  return () => globalThis.removeEventListener(CHANGE, handler);
}
