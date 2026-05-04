import { Link } from 'react-router-dom';

const brands = [
  { label: 'Nike', to: '/shop?brand=Nike' },
  { label: 'Jordan', to: '/shop?brand=Nike' },
  { label: 'adidas', to: '/shop?brand=adidas' },
  { label: 'New Balance', to: '/shop?brand=New%20Balance' },
  { label: 'PUMA', to: '/shop?brand=Puma' },
  { label: 'ASICS', to: '/shop?brand=ASICS' },
  { label: 'Converse', to: '/shop?brand=Converse' },
  { label: 'Reebok', to: '/shop?brand=Reebok' },
  { label: 'Vans', to: '/shop?brand=Vans' },
];

export function BrandStrip() {
  return (
    <section
      id="brands"
      className="border-y border-neutral-200 bg-neutral-100 py-10"
      aria-labelledby="brand-strip-heading"
    >
      <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8">
        <h2
          id="brand-strip-heading"
          className="text-center text-xl font-[800] uppercase tracking-tight text-black [font-stretch:condensed] sm:text-2xl"
        >
          Shop our top brands
        </h2>
        <p className="mt-2 text-center text-sm text-neutral-600">
          Fulfilled from Nairobi — prices in Kenyan Shillings (KSh). Brand names
          belong to their owners.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3 sm:gap-4 md:justify-between">
          {brands.map((b) => (
            <Link
              key={b.label}
              to={b.to}
              className="group flex min-h-[76px] min-w-[calc(33.333%-0.75rem)] flex-[1_0_140px] max-w-[200px] cursor-pointer flex-col items-center justify-center rounded-lg border border-neutral-300 bg-white px-3 py-3 text-center shadow-sm transition hover:-translate-y-0.5 hover:border-neutral-950 hover:shadow-md sm:min-w-[120px]"
            >
              <span className="text-[13px] font-[800] uppercase tracking-tighter text-neutral-950 [font-stretch:condensed] group-hover:text-brand-red">
                {b.label}
              </span>
              <span className="sr-only">{`Shop ${b.label}`}</span>
              <span className="mt-1 text-[10px] font-semibold uppercase tracking-widest text-neutral-500">
                Shop
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
