import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { EmptyState } from '../components/EmptyState.jsx';
import { useCart } from '../hooks/useCart.js';
import { useToast } from '../hooks/useToast.js';
import { COUNTRY } from '../config/market.js';
import { formatPrice } from '../utils/format.js';
import { appendOrderToHistory } from '../utils/ordersHistory.js';

export function Checkout() {
  const navigate = useNavigate();
  const { items, subtotal, clearCart } = useCart();
  const { show } = useToast();
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [placed, setPlaced] = useState(false);
  const [lastOrderId, setLastOrderId] = useState('');

  function handleSubmit(e) {
    e.preventDefault();
    if (!items.length) return;
    const lines = items.map((line) => ({
      productId: line.productId,
      name: line.snapshot.name,
      brand: line.snapshot.brand,
      size: line.size,
      qty: line.qty,
      lineTotalKes: line.snapshot.price * line.qty,
    }));
    const id = appendOrderToHistory({
      customerName: name,
      phone,
      address,
      subtotalKes: subtotal,
      lines,
    });
    setLastOrderId(id);
    setPlaced(true);
    clearCart();
    show(`Order confirmed — ${id}. Saved under My orders.`, 'success');
    setTimeout(() => navigate('/'), 2200);
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
            . Demo routes home in a moment.
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
        Pay on delivery &amp; M-Pesa integrations ship next — this form captures
        your Kenya delivery details in KSh.
      </p>

      <div className="mt-10 grid gap-10 lg:grid-cols-[1fr,320px]">
        <form
          onSubmit={handleSubmit}
          className="space-y-6 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm"
        >
          <div>
            <label
              htmlFor="co-name"
              className="text-xs font-semibold uppercase tracking-wider text-neutral-500"
            >
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
            <label
              htmlFor="co-address"
              className="text-xs font-semibold uppercase tracking-wider text-neutral-500"
            >
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
            <label
              htmlFor="co-phone"
              className="text-xs font-semibold uppercase tracking-wider text-neutral-500"
            >
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
          <button
            type="submit"
            className="h-12 w-full rounded-full bg-black text-sm font-semibold text-white transition hover:bg-neutral-900"
          >
            Place order
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
          <p className="mt-4 text-xs text-neutral-500">
            16% VAT and courier tariffs will itemise here once live quoting is
            wired — subtotal stays in KSh as shown.
          </p>
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
