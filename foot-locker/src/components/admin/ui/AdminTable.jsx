/** @param {{ children: import('react').ReactNode, minWidth?: string }} props */
export function AdminTable({ children, minWidth = 'min-w-[640px]' }) {
  return (
    <div className="overflow-x-auto">
      <table className={`w-full ${minWidth} text-left text-sm`}>{children}</table>
    </div>
  );
}

export function AdminTableHead({ children }) {
  return (
    <thead className="border-b border-neutral-200 bg-neutral-50/80">
      <tr className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">{children}</tr>
    </thead>
  );
}

export function AdminTableBody({ children }) {
  return <tbody className="divide-y divide-neutral-100">{children}</tbody>;
}

/** @param {{ children: import('react').ReactNode, className?: string }} props */
export function AdminTh({ children, className = '' }) {
  return <th className={`px-4 py-3.5 font-semibold ${className}`}>{children}</th>;
}

/** @param {{ children: import('react').ReactNode, className?: string }} props */
export function AdminTd({ children, className = '' }) {
  return <td className={`px-4 py-3.5 ${className}`}>{children}</td>;
}
