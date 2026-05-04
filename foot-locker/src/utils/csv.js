/** @param {string} cell */
export function csvEscape(cell) {
  const s = String(cell ?? '');
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

/** @param {(string | number)[][]} rows */
export function rowsToCsv(rows) {
  return rows.map((r) => r.map(csvEscape).join(',')).join('\r\n');
}

/** @param {string} filename */
export function downloadTextFile(filename, text, mime = 'text/csv;charset=utf-8') {
  const bom = '\uFEFF';
  const blob = new Blob([bom + text], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
