import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { EmptyState } from '../components/EmptyState.jsx';
import { useCart } from '../hooks/useCart.js';
import { useToast } from '../hooks/useToast.js';
import { COUNTRY } from '../config/market.js';
import { formatPrice } from '../utils/format.js';
import { isLoggedIn } from '../utils/auth.js';
import { checkoutOrder, validateCoupon } from '../utils/api.js';

export function Checkout() {
  const navigate = useNavigate();
  const { items, subtotal, clearCart } = useCart();
  const { show } = useToast();
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [couponApplied, setCouponApplied] = useState(null);
  const [validatingCoupon, setValidatingCoupon] = useState(false);
  const [placed, setPlaced] = useState(false);
  const [lastOrderId, setLastOrderId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function handleApplyCoupon() {
    const code = couponCode.trim().toUpperCase();
    if (!code) return;
    setValidatingCoupon(true);
    setError('');
    try {
      const res = await validateCoupon(code);
      if (!res.valid) {
        setCouponApplied(null);
        setError(res.message || 'Invalid coupon code');
        return;
      }
      setCouponApplied(res);
      show(`Coupon ${code} applied`, 'success');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not validate coupon');
    } finally {
      setValidatingCoupon(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!items.length) return;

    if (!isLoggedIn()) {
      show('Sign in to complete checkout', 'error');
      navigate('/sign-in', { state: { from: '/checkout' } });
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      const shippingAddress = [name, phone, address].filter(Boolean).join(' · ');
      const payload = {
        shipping_address: shippingAddress,
        payment_method: 'pay_on_delivery',
      };
      if (couponApplied?.code) {
        payload.coupon_code = couponApplied.code;
      } else if (couponCode.trim()) {
        payload.coupon_code = couponCode.trim().toUpperCase();
      }

      const result = await checkoutOrder(payload);
      const id = result.order_id
        ? `ORD-${String(result.order_id).padStart(3, '0')}`
        : 'confirmed';
      setLastOrderId(id);
      setPlaced(true);
      clearCart();
      show(`Order confirmed — ${id}`, 'success');
      setTimeout(() => navigate('/account/orders'), 2200);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Checkout failed');
      show('Checkout failed — please try again', 'error');
    } finally {
      setSubmitting(false);
    }
  }

  if (items.length === 0 && !placed) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 sm:px-6 lg:px-8">
        <EmptyState
          title="Nothing to checkout"
          description="Add sneakers to your cart before completing an order."
        >
          <Link
            to="/shop"
            className="inline-flex rounded-full bg-black px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-neutral-900"
          >
            Continue shopping
          </Link>
        </EmptyState>
      </div>
    );
  }

  if (placed) {
    return (
      <div className="mx-auto max-w-lg px-4 py-24 text-center sm:px-6 lg:px-8">
        <div className="animate-fade-rise rounded-2xl border border-neutral-200 bg-white p-10 shadow-[var(--shadow-card)]">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand-red text-white">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden
            >
              <path d="M20 6 9 17l-5-5" />
            </svg>
          </div>
          <h1 className="mt-6 text-2xl font-semibold text-black">
            Order placed — thank you
          </h1>
          <p className="mt-2 text-sm text-neutral-600">
            Thanks {name || 'there'}!
            {lastOrderId ? (
              <>
                {' '}
                Reference{' '}
                <span className="font-mono font-semibold text-neutral-900">{lastOrderId}</span>
                {' — '}
              </>
            ) : null}
            View details anytime under{' '}
            <Link to="/account/orders" className="font-semibold text-brand-red hover:underline">
              My orders
            </Link>
            .
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-semibold tracking-tight text-black sm:text-4xl">
        Checkout
      </h1>
      <p className="mt-2 text-neutral-600">
        Pay on delivery — your cart is saved to your account.
      </p>

      {!isLoggedIn() ? (
        <p className="mt-4 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <Link to="/sign-in" className="font-semibold text-brand-red hover:underline">
            Sign in
          </Link>{' '}
          or create an account to place your order.
        </p>
      ) : null}

      {error ? (
        <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      ) : null}

      <div className="mt-10 grid gap-10 lg:grid-cols-[1fr,320px]">
        <form
          onSubmit={handleSubmit}
          className="space-y-6 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm"
        >
          <div>
            <label htmlFor="co-name" className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
              Full name
            </label>
            <input
              id="co-name"
              name="name"
              required
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-2 w-full rounded-xl border border-neutral-200 px-3 py-3 text-sm shadow-sm outline-none transition focus:border-black focus:ring-2 focus:ring-black/10"
            />
          </div>
          <div>
            <label htmlFor="co-address" className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
              Delivery address ({COUNTRY})
            </label>
            <textarea
              id="co-address"
              name="address"
              required
              rows={3}
              autoComplete="street-address"
              placeholder="Estate, road, building, town, county & postal code"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="mt-2 w-full resize-y rounded-xl border border-neutral-200 px-3 py-3 text-sm shadow-sm outline-none transition focus:border-black focus:ring-2 focus:ring-black/10"
            />
          </div>
          <div>
            <label htmlFor="co-phone" className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
              Phone (Safaricom / Airtel)
            </label>
            <input
              id="co-phone"
              name="phone"
              type="tel"
              required
              autoComplete="tel"
              placeholder="+254 712 345 678"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="mt-2 w-full rounded-xl border border-neutral-200 px-3 py-3 text-sm shadow-sm outline-none transition focus:border-black focus:ring-2 focus:ring-black/10"
            />
          </div>
          <div>
            <label htmlFor="co-coupon" className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
              Promo code
            </label>
            <div className="mt-2 flex gap-2">
              <input
                id="co-coupon"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                placeholder="MADARAKA"
                className="min-w-0 flex-1 rounded-xl border border-neutral-200 px-3 py-3 text-sm uppercase shadow-sm outline-none transition focus:border-black focus:ring-2 focus:ring-black/10"
              />
              <button
                type="button"
                onClick={handleApplyCoupon}
                disabled={validatingCoupon || !couponCode.trim()}
                className="shrink-0 rounded-full border border-neutral-200 px-4 text-sm font-semibold hover:bg-neutral-50 disabled:opacity-50"
              >
                {validatingCoupon ? '…' : 'Apply'}
              </button>
            </div>
            {couponApplied ? (
              <p className="mt-2 text-xs font-medium text-emerald-700">
                {couponApplied.code} applied —{' '}
                {String(couponApplied.discount_type).toLowerCase().includes('percent')
                  ? `${couponApplied.discount_value}% off`
                  : `${formatPrice(Number(couponApplied.discount_value))} off`}
              </p>
            ) : null}
          </div>
          <button
            type="submit"
            disabled={submitting || !isLoggedIn()}
            className="h-12 w-full rounded-full bg-black text-sm font-semibold text-white transition hover:bg-neutral-900 disabled:opacity-50"
          >
            {submitting ? 'Placing order…' : 'Place order'}
          </button>
        </form>

        <aside className="h-fit rounded-2xl border border-neutral-200 bg-neutral-50 p-6 shadow-sm animate-fade-rise">
          <h2 className="text-lg font-semibold text-black">Order summary</h2>
          <ul className="mt-4 max-h-[320px] space-y-3 overflow-y-auto text-sm">
            {items.map((line) => (
              <li key={line.lineId} className="flex justify-between gap-3">
                <span className="min-w-0 truncate text-neutral-700">
                  {line.snapshot.name} × {line.qty}
                </span>
                <span className="shrink-0 font-medium">
                  {formatPrice(line.snapshot.price * line.qty)}
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-6 border-t border-neutral-200 pt-4">
            <div className="flex justify-between text-base font-bold">
              <span>Total</span>
              <span>{formatPrice(subtotal)}</span>
            </div>
          </div>
          <Link
            to="/cart"
            className="mt-4 inline-flex text-sm font-semibold text-brand-red hover:underline"
          >
            Edit cart
          </Link>
        </aside>
      </div>
    </div>
  );
}
