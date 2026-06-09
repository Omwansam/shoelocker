/** @returns {boolean} */
export function isLoggedIn() {
  return Boolean(localStorage.getItem('token'));
}

/** @returns {any | null} */
export function getStoredUser() {
  try {
    const raw = localStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
