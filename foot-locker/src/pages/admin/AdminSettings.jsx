import { COMPANY_NAME, SUPPORT_EMAIL } from '../../config/brand.js';
import { getAdminDemoPassword, resetAdminPersistedDemo } from '../../config/admin.js';
import {
  MARKET_LOCALE,
  CURRENCY_CODE,
  COUNTRY,
} from '../../config/market.js';
import { useAdminAuth } from '../../hooks/useAdminAuth.js';

export function AdminSettings() {
  const { logout } = useAdminAuth();

  return (
    <div className="mx-auto max-w-3xl space-y-8 animate-fade-rise">
      <div>
        <h1 className="text-2xl font-bold text-neutral-950">Settings</h1>
        <p className="mt-1 text-sm text-neutral-600">
          Store switches you’d normally persist via API — read-only placeholders.
        </p>
      </div>

      <section className="space-y-4 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-neutral-950">Regional</h2>
        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-neutral-500">Market</dt>
            <dd className="font-medium">{COUNTRY}</dd>
          </div>
          <div>
            <dt className="text-neutral-500">Locale</dt>
            <dd className="font-medium">{MARKET_LOCALE}</dd>
          </div>
          <div>
            <dt className="text-neutral-500">Settlement currency</dt>
            <dd className="font-medium">{CURRENCY_CODE}</dd>
          </div>
          <div>
            <dt className="text-neutral-500">Brand</dt>
            <dd className="font-medium">{COMPANY_NAME}</dd>
          </div>
        </dl>
      </section>

      <section className="space-y-4 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-neutral-950">Demo data</h2>
        <p className="text-sm text-neutral-600">
          Clears staff-side experiment state: Nairobi DC quantities, patched
          order statuses, bespoke catalog (new SKUs/edits/images), custom
          promo codes, plus storefront demo wishlist, checkout order history,
          &amp; footer newsletter signups stored in this browser. Your admin
          session stays signed in until you deliberately sign out.
        </p>
        <button
          type="button"
          onClick={() => {
            resetAdminPersistedDemo();
            window.location.reload();
          }}
          className="rounded-full border border-neutral-300 bg-white px-5 py-2.5 text-sm font-semibold text-neutral-950 transition hover:bg-neutral-50"
        >
          Reset demo payloads &amp; reload
        </button>
      </section>

      <section className="space-y-4 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-neutral-950">Security</h2>
        <p className="text-sm text-neutral-600">
          Demo admin password is{' '}
          <code className="rounded bg-neutral-100 px-1.5 py-0.5 text-neutral-900">
            {getAdminDemoPassword()}
          </code>
          . Override with environment variable{' '}
          <code className="rounded bg-neutral-100 px-1.5 py-0.5">VITE_ADMIN_PASSWORD</code>{' '}
          before deploy.
        </p>
        <p className="text-sm text-neutral-600">
          Support escalation:{' '}
          <a className="font-semibold text-brand-red" href={`mailto:${SUPPORT_EMAIL}`}>
            {SUPPORT_EMAIL}
          </a>
        </p>
        <button
          type="button"
          onClick={logout}
          className="rounded-full bg-neutral-950 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-neutral-800"
        >
          Sign out all staff (this browser)
        </button>
      </section>
    </div>
  );
}
