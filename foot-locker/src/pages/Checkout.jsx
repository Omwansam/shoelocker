import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { EmptyState } from '../components/EmptyState.jsx';
import { useCart } from '../hooks/useCart.js';
import { useStoreSettings } from '../hooks/useStoreSettings.js';
import { useToast } from '../hooks/useToast.js';
import { formatPrice } from '../utils/format.js';
import { isLoggedIn } from '../utils/auth.js';
import {
  checkoutOrder,
  fetchSavedAddresses,
  previewCheckout,
  validateCoupon,
} from '../utils/api.js';
import { initiateMpesaPayment, pollMpesaPaymentStatus } from '../utils/payments.js';

function formatAddress(addr) {
  return [
    `${addr.first_name} ${addr.last_name}`,
    addr.street_address,
    `${addr.city}, ${addr.province} ${addr.zip_code}`,
    addr.country,
    addr.phone,
  ]
    .filter(Boolean)
    .join(' · ');
}

export function Checkout() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { items, subtotal, clearCart } = useCart();
  const { show } = useToast();
  const { settings: storeSettings } = useStoreSettings();

  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [city, setCity] = useState('');
  const [county, setCounty] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [couponApplied, setCouponApplied] = useState(null);
  const [validatingCoupon, setValidatingCoupon] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('pay_on_delivery');
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState('');
  const [totals, setTotals] = useState(null);
  const [placed, setPlaced] = useState(false);
  const [lastOrderId, setLastOrderId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [mpesaStep, setMpesaStep] = useState('');
  const [error, setError] = useState('');

  const appliedCode = couponApplied?.code || couponCode.trim().toUpperCase() || '';

  useEffect(() => {
    if (!storeSettings) return;
    if (storeSettings.mpesa_enabled === false && storeSettings.cod_enabled !== false) {
      setPaymentMethod('pay_on_delivery');
    } else if (storeSettings.mpesa_enabled !== false) {
      setPaymentMethod('mpesa');
    }
  }, [storeSettings?.mpesa_enabled, storeSettings?.cod_enabled]);

  useEffect(() => {
    let active = true;
    async function load() {
      if (!isLoggedIn()) return;
      try {
        const addresses = await fetchSavedAddresses();
        if (!active) return;
        setSavedAddresses(addresses);
        const defaultAddr = addresses.find((a) => a.is_default) || addresses[0];
        if (defaultAddr) {
          setSelectedAddressId(String(defaultAddr.id));
          setName(`${defaultAddr.first_name} ${defaultAddr.last_name}`.trim());
          setAddress(defaultAddr.street_address);
          setPhone(defaultAddr.phone);
          setEmail(defaultAddr.email || '');
          setCity(defaultAddr.city || '');
          setCounty(defaultAddr.province || '');
        }
      } catch {
        //
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!isLoggedIn() || !items.length) {
      setTotals(null);
      return;
    }
    let active = true;
    const timer = setTimeout(async () => {
      try {
        const preview = await previewCheckout(appliedCode || undefined);
        if (active) setTotals(preview);
      } catch {
        if (active) setTotals(null);
      }
    }, 300);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [items.length, appliedCode, subtotal]);

  function handleAddressSelect(id) {
    setSelectedAddressId(id);
    const addr = savedAddresses.find((a) => String(a.id) === id);
    if (!addr) return;
    setName(`${addr.first_name} ${addr.last_name}`.trim());
    setAddress(addr.street_address);
    setPhone(addr.phone);
    setEmail(addr.email || '');
    setCity(addr.city || '');
    setCounty(addr.province || '');
  }

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
    setMpesaStep('');
    try {
      const shippingAddress = [name, phone, address, city, county, storeSettings.country].filter(Boolean).join(' · ');
      const payload = {
        shipping_address: shippingAddress,
        payment_method: paymentMethod,
        customer_name: name,
        customer_phone: phone,
        customer_email: email,
        city,
        county,
      };
      if (appliedCode) payload.coupon_code = appliedCode;

      const result = await checkoutOrder(payload);
      const orderId = result.order_id;
      const id = orderId ? `ORD-${String(orderId).padStart(3, '0')}` : 'confirmed';

      if (paymentMethod === 'mpesa') {
        setMpesaStep('Sending M-Pesa prompt to your phone…');
        const stk = await initiateMpesaPayment({
          phone_number: phone,
          order_id: orderId,
          amount: Number(result.total_amount),
        });
        if (stk.checkout_request_id) {
          setMpesaStep('Waiting for M-Pesa confirmation…');
          await pollMpesaPaymentStatus(stk.checkout_request_id);
        }
      }

      setLastOrderId(id);
      setPlaced(true);
      clearCart();
      show(`Order confirmed — ${id}`, 'success');
      const redirect = searchParams.get('from') || '/account/orders';
      setTimeout(() => navigate(redirect), 2200);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Checkout failed');
      show('Checkout failed — please try again', 'error');
    } finally {
      setSubmitting(false);
      setMpesaStep('');
    }
  }

  const codEnabled = storeSettings?.cod_enabled !== false;
  const mpesaEnabled = storeSettings?.mpesa_enabled !== false;
  const shippingCost = Number(totals?.shipping_cost ?? 0);
  const discount = Number(totals?.discount ?? 0);
  const orderTotal = Number(totals?.total_amount ?? subtotal);
  const freeThreshold = Number(storeSettings?.free_shipping_threshold ?? totals?.free_shipping_threshold ?? 12000);

  if (items.length === 0 && !placed) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 sm:px-6 lg:px-8">
        <EmptyState title="Nothing to checkout" description="Add sneakers to your cart before completing an order.">
          <Link to="/shop" className="inline-flex rounded-full bg-black px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-neutral-900">
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
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <path d="M20 6 9 17l-5-5" />
            </svg>
          </div>
          <h1 className="mt-6 text-2xl font-semibold text-black">Order placed — thank you</h1>
          <p className="mt-2 text-sm text-neutral-600">
            Thanks {name || 'there'}!
            {lastOrderId ? (
              <> Reference <span className="font-mono font-semibold text-neutral-900">{lastOrderId}</span> — </>
            ) : null}
            View details under{' '}
            <Link to="/account/orders" className="font-semibold text-brand-red hover:underline">My orders</Link>.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-semibold tracking-tight text-black sm:text-4xl">Checkout</h1>
      <p className="mt-2 text-neutral-600">Secure checkout with M-Pesa or pay on delivery.</p>

      {!isLoggedIn() ? (
        <p className="mt-4 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <Link to="/sign-in" className="font-semibold text-brand-red hover:underline">Sign in</Link>{' '}
          or create an account to place your order.
        </p>
      ) : null}

      {error ? <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}
      {mpesaStep ? <p className="mt-4 rounded-xl bg-sky-50 px-4 py-3 text-sm text-sky-900">{mpesaStep}</p> : null}

      <div className="mt-10 grid gap-10 lg:grid-cols-[1fr,320px]">
        <form onSubmit={handleSubmit} className="space-y-6 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
          {savedAddresses.length ? (
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Saved address</label>
              <select
                value={selectedAddressId}
                onChange={(e) => handleAddressSelect(e.target.value)}
                className="mt-2 w-full rounded-xl border border-neutral-200 px-3 py-3 text-sm"
              >
                <option value="">Enter a new address</option>
                {savedAddresses.map((addr) => (
                  <option key={addr.id} value={addr.id}>
                    {formatAddress(addr)}
                  </option>
                ))}
              </select>
            </div>
          ) : null}

          <div>
            <label htmlFor="co-name" className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Full name</label>
            <input id="co-name" required value={name} onChange={(e) => setName(e.target.value)} className="mt-2 w-full rounded-xl border border-neutral-200 px-3 py-3 text-sm" />
          </div>
          <div>
            <label htmlFor="co-address" className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Delivery address ({storeSettings.country})</label>
            <textarea id="co-address" required rows={3} value={address} onChange={(e) => setAddress(e.target.value)} className="mt-2 w-full resize-y rounded-xl border border-neutral-200 px-3 py-3 text-sm" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="co-city" className="text-xs font-semibold uppercase tracking-wider text-neutral-500">City / town</label>
              <input id="co-city" value={city} onChange={(e) => setCity(e.target.value)} className="mt-2 w-full rounded-xl border border-neutral-200 px-3 py-3 text-sm" />
            </div>
            <div>
              <label htmlFor="co-county" className="text-xs font-semibold uppercase tracking-wider text-neutral-500">County</label>
              <input id="co-county" value={county} onChange={(e) => setCounty(e.target.value)} className="mt-2 w-full rounded-xl border border-neutral-200 px-3 py-3 text-sm" />
            </div>
          </div>
          <div>
            <label htmlFor="co-phone" className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Phone (M-Pesa number)</label>
            <input id="co-phone" type="tel" required value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+254 712 345 678" className="mt-2 w-full rounded-xl border border-neutral-200 px-3 py-3 text-sm" />
          </div>
          <div>
            <label htmlFor="co-email" className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Email</label>
            <input id="co-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-2 w-full rounded-xl border border-neutral-200 px-3 py-3 text-sm" />
          </div>

          <fieldset>
            <legend className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Payment method</legend>
            <div className="mt-3 space-y-2">
              {mpesaEnabled ? (
                <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-neutral-200 px-4 py-3">
                  <input type="radio" name="payment" value="mpesa" checked={paymentMethod === 'mpesa'} onChange={() => setPaymentMethod('mpesa')} />
                  <span className="text-sm font-medium">M-Pesa (pay now)</span>
                </label>
              ) : null}
              {codEnabled ? (
                <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-neutral-200 px-4 py-3">
                  <input type="radio" name="payment" value="pay_on_delivery" checked={paymentMethod === 'pay_on_delivery'} onChange={() => setPaymentMethod('pay_on_delivery')} />
                  <span className="text-sm font-medium">Pay on delivery</span>
                </label>
              ) : null}
            </div>
          </fieldset>

          <div>
            <label htmlFor="co-coupon" className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Promo code</label>
            <div className="mt-2 flex gap-2">
              <input id="co-coupon" value={couponCode} onChange={(e) => setCouponCode(e.target.value.toUpperCase())} className="min-w-0 flex-1 rounded-xl border border-neutral-200 px-3 py-3 text-sm uppercase" />
              <button type="button" onClick={handleApplyCoupon} disabled={validatingCoupon || !couponCode.trim()} className="shrink-0 rounded-full border border-neutral-200 px-4 text-sm font-semibold hover:bg-neutral-50 disabled:opacity-50">
                {validatingCoupon ? '…' : 'Apply'}
              </button>
            </div>
          </div>

          <button type="submit" disabled={submitting || !isLoggedIn()} className="h-12 w-full rounded-full bg-black text-sm font-semibold text-white transition hover:bg-neutral-900 disabled:opacity-50">
            {submitting ? (paymentMethod === 'mpesa' ? 'Processing M-Pesa…' : 'Placing order…') : paymentMethod === 'mpesa' ? 'Pay with M-Pesa' : 'Place order'}
          </button>
        </form>

        <aside className="h-fit rounded-2xl border border-neutral-200 bg-neutral-50 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-black">Order summary</h2>
          <ul className="mt-4 max-h-[320px] space-y-3 overflow-y-auto text-sm">
            {items.map((line) => (
              <li key={line.lineId} className="flex justify-between gap-3">
                <span className="min-w-0 truncate text-neutral-700">{line.snapshot.name} × {line.qty}</span>
                <span className="shrink-0 font-medium">{formatPrice(line.snapshot.price * line.qty)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-6 space-y-2 border-t border-neutral-200 pt-4 text-sm">
            <div className="flex justify-between"><span>Subtotal</span><span>{formatPrice(subtotal)}</span></div>
            <div className="flex justify-between"><span>Shipping</span><span>{shippingCost === 0 ? 'Free' : formatPrice(shippingCost)}</span></div>
            {discount > 0 ? <div className="flex justify-between text-emerald-700"><span>Discount</span><span>-{formatPrice(discount)}</span></div> : null}
            <div className="flex justify-between border-t border-neutral-200 pt-3 text-base font-bold">
              <span>Total</span><span>{formatPrice(orderTotal)}</span>
            </div>
          </div>
          {subtotal < freeThreshold ? (
            <p className="mt-3 text-xs text-neutral-500">Free shipping on orders over {formatPrice(freeThreshold)}</p>
          ) : null}
          <Link to="/cart" className="mt-4 inline-flex text-sm font-semibold text-brand-red hover:underline">Edit cart</Link>
        </aside>
      </div>
    </div>
  );
}
