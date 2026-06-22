import { Link } from 'react-router-dom';
import { EmptyState } from '../components/EmptyState.jsx';
import { FreeShippingNote } from '../components/FreeShippingNote.jsx';
import { useCart } from '../hooks/useCart.js';
import { formatPrice } from '../utils/format.js';

export function Cart() {
  const { items, updateQty, removeItem, subtotal, itemCount, clearCart } =
    useCart();

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-semibold tracking-tight text-black sm:text-4xl">
        Shopping cart
      </h1>
      <p className="mt-2 text-neutral-600">
        {itemCount === 0
          ? 'No pairs in your bag yet.'
          : `${itemCount} ${itemCount === 1 ? 'item' : 'items'} ready for checkout.`}
      </p>

      {items.length === 0 ? (
        <div className="mt-10">
          <EmptyState
            title="Your cart is empty"
            description="Browse the wall and add your next grail — sizes and quick-add are tuned for mobile."
          >
            <Link
              to="/shop"
              className="inline-flex rounded-full bg-black px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-neutral-900"
            >
              Start shopping
            </Link>
          </EmptyState>
        </div>
      ) : (
        <div className="mt-10 grid gap-10 lg:grid-cols-[1fr,320px]">
          <ul className="space-y-4">
            {items.map((line) => (
              <li
                key={line.lineId}
                className="flex gap-4 rounded-2xl border border-neutral-200 bg-white p-4 shadow-[var(--shadow-card)] animate-fade-rise"
              >
                <img
                  src={line.snapshot.image}
                  alt=""
                  width={112}
                  height={112}
                  className="h-28 w-28 shrink-0 rounded-xl object-cover"
                  loading="lazy"
                  decoding="async"
                />
                <div className="flex min-w-0 flex-1 flex-col gap-2">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
                        {line.snapshot.brand}
                      </p>
                      <Link
                        to={`/product/${line.productId}`}
                        className="mt-1 block font-semibold text-black transition hover:text-brand-red"
                      >
                        {line.snapshot.name}
                      </Link>
                      <p className="text-sm text-neutral-600">
                        Size {line.size} (men's US scale)
                      </p>
                    </div>
                    <p className="whitespace-nowrap text-base font-semibold">
                      {formatPrice(line.snapshot.price)}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 border-t border-neutral-100 pt-3">
                    <label
                      htmlFor={`cart-q-${line.lineId}`}
                      className="text-xs font-medium uppercase tracking-wider text-neutral-500"
                    >
                      Qty
                    </label>
                    <input
                      id={`cart-q-${line.lineId}`}
                      type="number"
                      min={1}
                      max={99}
                      value={line.qty}
                      onChange={(e) =>
                        updateQty(line.lineId, Number(e.target.value))
                      }
                      className="w-20 rounded-lg border border-neutral-200 px-2 py-1.5 text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => removeItem(line.lineId)}
                      className="text-sm font-semibold text-brand-red transition hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          <aside className="h-fit rounded-2xl border border-neutral-200 bg-neutral-50 p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-black">Order summary</h2>
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between text-neutral-600">
                <dt>Subtotal</dt>
                <dd className="font-medium text-black">
                  {formatPrice(subtotal)}
                </dd>
              </div>
              <div className="flex justify-between text-neutral-600">
                <dt>Courier &amp; VAT</dt>
                <dd className="font-medium text-black">Quoted at checkout (KSh)</dd>
              </div>
            </dl>
            <div className="my-4 border-t border-neutral-200" />
            <FreeShippingNote subtotal={subtotal} className="mb-4" />
            <div className="flex justify-between text-base font-bold">
              <span>Total</span>
              <span>{formatPrice(subtotal)}</span>
            </div>
            <Link
              to="/checkout"
              className="mt-6 flex h-12 items-center justify-center rounded-full bg-brand-red text-sm font-semibold text-white transition hover:bg-brand-red-hover"
            >
              Proceed to checkout
            </Link>
            <button
              type="button"
              onClick={clearCart}
              className="mt-3 w-full text-center text-sm font-medium text-neutral-600 underline decoration-neutral-300 decoration-1 underline-offset-2 transition hover:text-black"
            >
              Clear cart
            </button>
          </aside>
        </div>
      )}
    </div>
  );
}
