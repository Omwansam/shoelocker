/** @param {string} name */
export function suggestProductId(name) {
  const base = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40);
  return `${base || 'style'}-${Math.random().toString(36).slice(2, 8)}`;
}
