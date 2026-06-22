import { useEffect, useState } from 'react';
import { isLoggedIn } from '../utils/auth.js';
import { fetchProductReviews, submitProductReview } from '../utils/api.js';
import { getReviewsForProduct } from '../data/productReviews.js';

/**
 * @typedef {import('../data/products.js').products extends (infer P)[] ? P : never} Product
 */

/** @param {{ product: Product }} props */
export function ProductReviews({ product }) {
  const productId = product.product_id;
  const [reviews, setReviews] = useState([]);
  const [average, setAverage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    async function load() {
      if (!productId) {
        const fallback = getReviewsForProduct(product.id, product.name);
        if (active) {
          setReviews(
            fallback.map((r, i) => ({
              review_id: i,
              rating: r.rating,
              review_text: r.body,
              created_at: r.at,
              user: { username: r.author },
            })),
          );
          setAverage(fallback.reduce((s, r) => s + r.rating, 0) / Math.max(1, fallback.length));
          setLoading(false);
        }
        return;
      }
      try {
        const data = await fetchProductReviews(productId);
        if (!active) return;
        setReviews(data.reviews || []);
        setAverage(data.average_rating);
      } catch {
        if (active) {
          const fallback = getReviewsForProduct(product.id, product.name);
          setReviews(
            fallback.map((r, i) => ({
              review_id: i,
              rating: r.rating,
              review_text: r.body,
              created_at: r.at,
              user: { username: r.author },
            })),
          );
          setAverage(fallback.reduce((s, r) => s + r.rating, 0) / Math.max(1, fallback.length));
        }
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, [productId, product.id, product.name]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!productId || !isLoggedIn()) return;
    setSubmitting(true);
    setError('');
    setMessage('');
    try {
      await submitProductReview(productId, { rating, review_text: reviewText });
      const data = await fetchProductReviews(productId);
      setReviews(data.reviews || []);
      setAverage(data.average_rating);
      setReviewText('');
      setMessage('Thank you for your review');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not submit review');
    } finally {
      setSubmitting(false);
    }
  }

  const avgDisplay = average ?? (reviews.length
    ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
    : 0);

  return (
    <section className="mt-16 border-t border-neutral-200 pt-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-black">Reviews</h2>
          <p className="mt-1 text-neutral-600">
            {reviews.length} ratings · average {Number(avgDisplay).toFixed(1)} / 5
          </p>
        </div>
      </div>

      {loading ? (
        <div className="mt-8 flex justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-red border-t-transparent" />
        </div>
      ) : (
        <ul className="mt-8 space-y-6">
          {reviews.map((r) => (
            <li key={r.review_id} className="rounded-2xl border border-neutral-200 bg-neutral-50 p-5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-bold text-black">{r.rating}★</span>
                <span className="text-xs text-neutral-500">{r.created_at ? new Date(r.created_at).toLocaleDateString('en-KE') : ''}</span>
              </div>
              <p className="mt-1 text-sm font-medium text-neutral-800">{r.user?.username || 'Customer'}</p>
              <p className="mt-2 text-sm leading-relaxed text-neutral-700">{r.review_text}</p>
            </li>
          ))}
        </ul>
      )}

      {productId && isLoggedIn() ? (
        <form onSubmit={handleSubmit} className="mt-10 rounded-2xl border border-neutral-200 bg-white p-6">
          <h3 className="font-semibold text-black">Write a review</h3>
          <p className="mt-1 text-sm text-neutral-600">Only available for products you have ordered.</p>
          {error ? <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
          {message ? <p className="mt-3 rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{message}</p> : null}
          <div className="mt-4">
            <label className="text-xs font-bold uppercase text-neutral-500">Rating</label>
            <select value={rating} onChange={(e) => setRating(Number(e.target.value))} className="mt-2 rounded-xl border border-neutral-200 px-3 py-2 text-sm">
              {[5, 4, 3, 2, 1].map((n) => (
                <option key={n} value={n}>{n} stars</option>
              ))}
            </select>
          </div>
          <textarea required minLength={10} rows={4} value={reviewText} onChange={(e) => setReviewText(e.target.value)} placeholder="Share your experience with this product" className="mt-4 w-full rounded-xl border border-neutral-200 px-3 py-3 text-sm" />
          <button type="submit" disabled={submitting} className="mt-4 rounded-full bg-neutral-950 px-6 py-3 text-sm font-bold uppercase text-white disabled:opacity-50">
            {submitting ? 'Submitting…' : 'Submit review'}
          </button>
        </form>
      ) : null}
    </section>
  );
}
