/** @param {{ label: string, active: boolean, onClick: () => void }} props */
export function AdminChip({ label, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        active
          ? 'rounded-full bg-neutral-950 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm'
          : 'rounded-full border border-neutral-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-neutral-600 transition hover:border-neutral-300 hover:bg-neutral-50'
      }
    >
      {label}
    </button>
  );
}
