import { getReviewsForProduct } from '../data/productReviews.js';

/**
 * @typedef {import('../data/products.js').products extends (infer P)[] ? P : never} Product
 */

/** @param {{ product: Product }} props */
export function ProductReviews({ product }) {
  const rows = getReviewsForProduct(product.id, product.name);
  const avg =
    rows.reduce((s, r) => s + r.rating, 0) / Math.max(1, rows.length);

  return (
    <section className="mt-16 border-t border-neutral-200 pt-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-black">Reviews</h2>
          <p className="mt-1 text-neutral-600">
            {rows.length} ratings · average {avg.toFixed(1)} / 5 (demo data)
          </p>
        </div>
      </div>
      <ul className="mt-8 space-y-6">
        {rows.map((r, i) => (
          <li
            key={`${r.author}-${r.at}-${i}`}
            className="rounded-2xl border border-neutral-200 bg-neutral-50 p-5"
          >
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-bold text-black">{r.rating}★</span>
              <span className="text-sm font-semibold text-neutral-900">{r.title}</span>
              <span className="text-xs text-neutral-500">{r.at}</span>
            </div>
            <p className="mt-1 text-sm font-medium text-neutral-800">{r.author}</p>
            <p className="mt-2 text-sm leading-relaxed text-neutral-700">{r.body}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
