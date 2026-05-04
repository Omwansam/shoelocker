import { mockOrders, dashboardKpis, mockCustomers } from '../../data/adminMock.js';
import { formatPrice } from '../../utils/format.js';
import { downloadTextFile, rowsToCsv } from '../../utils/csv.js';
import { mergeCatalogList } from '../../utils/catalogStorage.js';
import {
  getEffectiveOrderStatus,
  useAdminOrderStatuses,
} from '../../hooks/useAdminOrderStatuses.js';

export function AdminReports() {
  const { patches } = useAdminOrderStatuses();

  function exportOrders() {
    const header = [
      'Order ID',
      'Placed',
      'Customer',
      'Email',
      'City',
      'County',
      'Status',
      'Lines',
      'Total_KES',
      'Courier',
      'Payment',
    ];
    const body = mockOrders.map((o) => {
      const status = getEffectiveOrderStatus(o, patches);
      return [
        o.id,
        o.placedAt,
        o.customer,
        o.customerEmail,
        o.city,
        o.county,
        status,
        o.lines,
        o.totalKes,
        o.courier,
        o.paymentMethod,
      ];
    });
    downloadTextFile(
      `shoelocker-orders-${new Date().toISOString().slice(0, 10)}.csv`,
      rowsToCsv([header, ...body]),
    );
  }

  function exportProducts() {
    const products = mergeCatalogList();
    const header = ['SKU', 'Name', 'Brand', 'Category', 'Price_KES', 'Sizes'];
    const body = products.map((p) => [
      p.id,
      p.name,
      p.brand,
      p.category,
      p.price,
      p.sizes.join(';'),
    ]);
    downloadTextFile(
      `shoelocker-products-${new Date().toISOString().slice(0, 10)}.csv`,
      rowsToCsv([header, ...body]),
    );
  }

  function exportCustomers() {
    const header = ['Name', 'Email', 'City', 'Orders', 'Lifetime_KES'];
    const body = mockCustomers.map((c) => [
      c.name,
      c.email,
      c.city,
      c.orders,
      c.lifetimeKes,
    ]);
    downloadTextFile(
      `shoelocker-customers-${new Date().toISOString().slice(0, 10)}.csv`,
      rowsToCsv([header, ...body]),
    );
  }

  const fulfilled = mockOrders.filter(
    (o) => getEffectiveOrderStatus(o, patches) === 'Fulfilled',
  ).length;

  return (
    <div className="mx-auto max-w-5xl space-y-8 animate-fade-rise">
      <div>
        <h1 className="text-2xl font-bold text-neutral-950">Reports &amp; export</h1>
        <p className="mt-1 text-sm text-neutral-600">
          Operational snapshots plus UTF-8 CSV downloads for spreadsheets.
        </p>
      </div>

      <section className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase text-neutral-500">
            Snapshot orders
          </p>
          <p className="mt-2 text-3xl font-bold tabular-nums">{mockOrders.length}</p>
          <p className="mt-1 text-xs text-neutral-500">
            Mock dataset in console (Kenya locales)
          </p>
        </div>
        <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase text-neutral-500">
            Fulfilled (with patches)
          </p>
          <p className="mt-2 text-3xl font-bold tabular-nums">{fulfilled}</p>
          <p className="mt-1 text-xs text-neutral-500">
            Status edits from Orders detail apply here
          </p>
        </div>
        <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase text-neutral-500">
            7d revenue (demo)
          </p>
          <p className="mt-2 text-2xl font-bold tabular-nums">
            {formatPrice(dashboardKpis.revenue7d)}
          </p>
        </div>
      </section>

      <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Downloads</h2>
        <p className="mt-1 text-sm text-neutral-600">
          BOM-prefixed CSV for Excel-safe Swahili or English headings.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={exportOrders}
            className="rounded-full bg-neutral-950 px-5 py-2.5 text-sm font-semibold text-white hover:bg-neutral-800"
          >
            Export orders
          </button>
          <button
            type="button"
            onClick={exportProducts}
            className="rounded-full border border-neutral-200 bg-white px-5 py-2.5 text-sm font-semibold text-neutral-800 hover:bg-neutral-50"
          >
            Export products
          </button>
          <button
            type="button"
            onClick={exportCustomers}
            className="rounded-full border border-neutral-200 bg-white px-5 py-2.5 text-sm font-semibold text-neutral-800 hover:bg-neutral-50"
          >
            Export customers
          </button>
        </div>
      </section>
    </div>
  );
}
