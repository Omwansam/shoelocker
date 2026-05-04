import { Link } from 'react-router-dom';

export function NotFound() {
  return (
    <div className="mx-auto flex max-w-lg flex-col items-center px-4 py-24 text-center sm:px-6">
      <p className="text-7xl font-black tabular-nums text-neutral-200">404</p>
      <h1 className="mt-4 text-2xl font-semibold text-black">Page not found</h1>
      <p className="mt-2 text-neutral-600">
        That URL is not on our wall. Head back to shopping or hit support if you followed a
        broken link.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link
          to="/"
          className="inline-flex rounded-full bg-black px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-neutral-900"
        >
          Home
        </Link>
        <Link
          to="/shop"
          className="inline-flex rounded-full border border-neutral-300 px-6 py-2.5 text-sm font-semibold text-neutral-900 transition hover:border-neutral-950"
        >
          Shop
        </Link>
        <Link
          to="/support"
          className="inline-flex rounded-full border border-transparent px-6 py-2.5 text-sm font-semibold text-brand-red hover:underline"
        >
          Support
        </Link>
      </div>
    </div>
  );
}
