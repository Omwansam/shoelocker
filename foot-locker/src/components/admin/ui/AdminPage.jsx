/** @param {{ children: import('react').ReactNode, className?: string }} props */
export function AdminPage({ children, className = '' }) {
  return (
    <div className={`mx-auto max-w-7xl space-y-6 animate-fade-rise ${className}`}>
      {children}
    </div>
  );
}
