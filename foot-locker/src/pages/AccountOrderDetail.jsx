import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { formatPrice } from '../utils/format.js';
import { labelForOrderStatus } from '../utils/orderStatus.js';
import { isLoggedIn } from '../utils/auth.js';
import { fetchMyOrder, requestOrderReturn } from '../utils/api.js';

function formatDate(iso) {
  try {
    return new Date(iso).toLocaleString('en-KE', { dateStyle: 'medium', timeStyle: 'short' });
  } catch {
    return iso;
  }
}

export function AccountOrderDetail() {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [returnReason, setReturnReason] = useState('');
  const [returning, setReturning] = useState(false);
  const [returnMessage, setReturnMessage] = useState('');

  useEffect(() => {
    let active = true;
    async function load() {
      if (!isLoggedIn() || !orderId) {
        setLoading(false);
        return;
      }
      try {
        const data = await fetchMyOrder(Number(orderId));
        if (active) setOrder(data);
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : 'Failed to load order');
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, [orderId]);

  if (!isLoggedIn()) {
    return (
      <div className="rounded-2xl border border-dashed border-neutral-300 bg-neutral-50 p-10 text-center">
        <Link to="/sign-in" className="text-sm font-semibold text-brand-red hover:underline">Sign in</Link>
      </div>
    );
  }

  async function handleReturn(e) {
    e.preventDefault();
    if (!order?.order_id) return;
    setReturning(true);
    setReturnMessage('');
    try {
      await requestOrderReturn(order.order_id, returnReason);
      setReturnMessage('Return request submitted. Our team will contact you.');
      setOrder((prev) => (prev ? { ...prev, return_status: 'requested' } : prev));
    } catch (err) {
      setReturnMessage(err instanceof Error ? err.message : 'Could not submit return');
    } finally {
      setReturning(false);
    }
  }

  if (loading) {
    return <div className="flex justify-center py-12"><div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-red border-t-transparent" /></div>;
  }

  if (error || !order) {
    return (
      <div className="rounded-2xl border border-neutral-200 bg-white p-8 text-center">
        <p className="text-neutral-700">{error || 'Order not found'}</p>
        <Link to="/account/orders" className="mt-4 inline-flex text-sm font-semibold text-brand-red hover:underline">Back to orders</Link>
      </div>
    );
  }

  const canReturn = order.status === 'delivered' && !order.return_status;

  return (
    <div className="max-w-3xl">
      <Link to="/account/orders" className="text-sm font-semibold text-brand-red hover:underline">← Back to orders</Link>
      <div className="mt-4 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-mono text-lg font-semibold text-black">{order.id}</h2>
          <p className="text-sm text-neutral-500">{formatDate(order.date)}</p>
        </div>
        <div className="mt-4 grid gap-2 text-sm text-neutral-700 sm:grid-cols-2">
          <p><span className="font-semibold text-neutral-900">Status:</span> {labelForOrderStatus(order.status)}</p>
          <p><span className="font-semibold text-neutral-900">Payment:</span> {order.payment_status || 'pending'}</p>
          {order.payment_method ? <p><span className="font-semibold text-neutral-900">Method:</span> {order.payment_method}</p> : null}
          {order.courier ? <p><span className="font-semibold text-neutral-900">Courier:</span> {order.courier}</p> : null}
          {order.return_status ? <p><span className="font-semibold text-neutral-900">Return:</span> {order.return_status}</p> : null}
        </div>
        {order.shipping_address ? <p className="mt-4 text-sm text-neutral-700">{order.shipping_address}</p> : null}
        <ul className="mt-6 space-y-2 border-t border-neutral-100 pt-4 text-sm">
          {(order.items || []).map((line) => (
            <li key={line.order_item_id || `${line.product_id}-${line.name}`} className="flex justify-between gap-3">
              <span>{line.name} × {line.quantity}{line.size ? ` · ${line.size}` : ''}</span>
              <span className="font-medium">{formatPrice((line.price || 0) * line.quantity)}</span>
            </li>
          ))}
        </ul>
        <div className="mt-4 flex justify-between border-t border-neutral-100 pt-4 text-base font-bold">
          <span>Total</span>
          <span>{formatPrice(order.total || 0)}</span>
        </div>
      </div>

      {canReturn ? (
        <form onSubmit={handleReturn} className="mt-6 rounded-2xl border border-neutral-200 bg-neutral-50 p-6">
          <h3 className="font-semibold text-black">Request a return</h3>
          <textarea required rows={3} value={returnReason} onChange={(e) => setReturnReason(e.target.value)} placeholder="Tell us why you would like to return this order" className="mt-3 w-full rounded-xl border border-neutral-200 px-3 py-3 text-sm" />
          <button type="submit" disabled={returning} className="mt-3 rounded-full bg-neutral-950 px-5 py-2.5 text-sm font-bold uppercase text-white disabled:opacity-50">
            {returning ? 'Submitting…' : 'Submit return request'}
          </button>
          {returnMessage ? <p className="mt-3 text-sm text-neutral-700">{returnMessage}</p> : null}
        </form>
      ) : null}
    </div>
  );
}
