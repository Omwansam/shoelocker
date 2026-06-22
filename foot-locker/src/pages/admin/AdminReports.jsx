import { useCallback, useEffect, useState } from 'react';
import { formatPrice } from '../../utils/format.js';
import { downloadTextFile } from '../../utils/csv.js';
import {
  exportAdminReport,
  fetchCustomerReport,
  fetchFinancialReport,
  fetchInventoryReport,
  fetchReportsDashboard,
  fetchSalesReport,
} from '../../utils/api.js';
import { SimpleBarChart } from '../../components/admin/SimpleBarChart.jsx';
import { SimpleDonut } from '../../components/admin/SimpleDonut.jsx';
import { StatCard } from '../../components/admin/StatCard.jsx';
import { AdminPage } from '../../components/admin/ui/AdminPage.jsx';
import { AdminPageHeader } from '../../components/admin/ui/AdminPageHeader.jsx';
import { AdminCard } from '../../components/admin/ui/AdminCard.jsx';
import { AdminAlert } from '../../components/admin/ui/AdminAlert.jsx';
import { AdminButton } from '../../components/admin/ui/AdminButton.jsx';
import { AdminLoading } from '../../components/admin/ui/AdminLoading.jsx';
import {
  AdminTable,
  AdminTableBody,
  AdminTableHead,
  AdminTd,
  AdminTh,
} from '../../components/admin/ui/AdminTable.jsx';

const PERIODS = [
  { label: '7 days', value: 7 },
  { label: '30 days', value: 30 },
  { label: '90 days', value: 90 },
];

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'sales', label: 'Sales' },
  { id: 'inventory', label: 'Inventory' },
  { id: 'customers', label: 'Customers' },
  { id: 'financial', label: 'Financial' },
];

const EXPORT_TYPES = [
  { id: 'sales', label: 'Sales orders', description: 'Order lines with customer and payment info' },
  { id: 'inventory', label: 'Inventory', description: 'Stock levels and availability status' },
  { id: 'customers', label: 'Customers', description: 'Registered customer accounts' },
  { id: 'financial', label: 'Financial', description: 'Revenue orders with payment breakdown' },
];

const DONUT_COLORS = ['#e60012', '#171717', '#059669', '#0284c7', '#a16207', '#7c3aed'];

function PeriodSelector({ days, onChange }) {
  return (
    <div className="flex flex-wrap gap-2">
      {PERIODS.map((p) => (
        <button
          key={p.value}
          type="button"
          onClick={() => onChange(p.value)}
          className={
            days === p.value
              ? 'rounded-full bg-neutral-950 px-4 py-2 text-xs font-semibold text-white'
              : 'rounded-full border border-neutral-200 bg-white px-4 py-2 text-xs font-semibold text-neutral-700 hover:bg-neutral-50'
          }
        >
          {p.label}
        </button>
      ))}
    </div>
  );
}

function TabNav({ active, onChange }) {
  return (
    <div className="flex flex-wrap gap-1 rounded-2xl border border-neutral-200 bg-neutral-50/80 p-1">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          className={
            active === tab.id
              ? 'rounded-xl bg-white px-4 py-2 text-sm font-semibold text-neutral-950 shadow-sm'
              : 'rounded-xl px-4 py-2 text-sm font-medium text-neutral-600 hover:text-neutral-900'
          }
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

function EmptyState({ message }) {
  return <p className="py-8 text-center text-sm text-neutral-500">{message}</p>;
}

export function AdminReports() {
  const [days, setDays] = useState(30);
  const [tab, setTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(null);
  const [error, setError] = useState(null);
  const [dashboard, setDashboard] = useState(null);
  const [sales, setSales] = useState(null);
  const [inventory, setInventory] = useState(null);
  const [customers, setCustomers] = useState(null);
  const [financial, setFinancial] = useState(null);

  const loadReports = useCallback(async (period) => {
    setLoading(true);
    setError(null);
    try {
      const [dashRes, salesRes, invRes, custRes, finRes] = await Promise.all([
        fetchReportsDashboard(period),
        fetchSalesReport(period),
        fetchInventoryReport(period),
        fetchCustomerReport(period),
        fetchFinancialReport(period),
      ]);
      if (dashRes?.success) setDashboard(dashRes.data);
      if (salesRes?.success) setSales(salesRes.data);
      if (invRes?.success) setInventory(invRes.data);
      if (custRes?.success) setCustomers(custRes.data);
      if (finRes?.success) setFinancial(finRes.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load reports');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadReports(days);
  }, [days, loadReports]);

  async function handleExport(type) {
    setExporting(type);
    setError(null);
    try {
      const res = await exportAdminReport(type, days);
      if (res?.success && res.data) {
        downloadTextFile(res.filename || `${type}-report.csv`, res.data);
      } else {
        throw new Error('Export failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed');
    } finally {
      setExporting(null);
    }
  }

  const quick = dashboard?.quick_stats || {};
  const salesSummary = sales?.summary || {};
  const invSummary = inventory?.summary || {};
  const custSummary = customers?.summary || {};
  const finSummary = financial?.summary || {};

  const revenueSeries = (sales?.daily_trend || []).slice(-14).map((d) => ({
    label: d.label?.slice(0, 6) || String(d.date || '').slice(5),
    value: d.total || 0,
  }));

  const orderSeries = (sales?.daily_trend || []).slice(-14).map((d) => ({
    label: d.label?.slice(0, 6) || String(d.date || '').slice(5),
    value: d.orders || 0,
  }));

  const statusSeries = (sales?.status_breakdown || []).map((s) => ({
    label: s.status,
    value: s.count,
  }));

  const categoryTotal = (sales?.category_sales || []).reduce((s, c) => s + (c.total || 0), 0) || 1;
  const categoryDonut = (sales?.category_sales || []).slice(0, 6).map((c, i) => ({
    label: c.category,
    pct: Math.round(((c.total || 0) / categoryTotal) * 100),
    color: DONUT_COLORS[i % DONUT_COLORS.length],
  }));

  const paymentTotal = (financial?.payment_methods || []).reduce((s, p) => s + (p.total || 0), 0) || 1;
  const paymentDonut = (financial?.payment_methods || []).map((p, i) => ({
    label: p.method,
    pct: Math.round(((p.total || 0) / paymentTotal) * 100),
    color: DONUT_COLORS[i % DONUT_COLORS.length],
  }));

  const monthlySeries = (financial?.monthly_trend || []).map((m) => ({
    label: m.label,
    value: m.revenue || 0,
  }));

  const segmentMax = Math.max(...(customers?.customer_segments || []).map((s) => s.count), 1);

  if (loading && !dashboard) {
    return <AdminLoading label="Loading reports…" />;
  }

  return (
    <AdminPage className="space-y-8">
      <AdminPageHeader
        title="Reports"
        description="Operational snapshots, trends, and CSV exports from live database records."
        actions={<PeriodSelector days={days} onChange={setDays} />}
      />

      {error ? <AdminAlert>{error}</AdminAlert> : null}

      <TabNav active={tab} onChange={setTab} />

      {tab === 'overview' && (
        <>
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              title={`Revenue (${days}d)`}
              value={formatPrice(quick.total_revenue ?? 0)}
              accent="red"
            />
            <StatCard title="Orders" value={String(quick.total_orders ?? 0)} accent="sky" />
            <StatCard title="Delivered" value={String(quick.delivered_orders ?? 0)} accent="emerald" />
            <StatCard
              title="Low stock SKUs"
              value={String(quick.low_stock_products ?? 0)}
              hint={`Threshold ≤ ${invSummary.low_stock_threshold ?? 5} units`}
              accent="dark"
            />
          </section>

          <div className="grid gap-6 lg:grid-cols-2">
            <AdminCard title="Daily revenue" subtitle={`Last ${Math.min(days, 14)} days`}>
              {revenueSeries.length ? (
                <SimpleBarChart data={revenueSeries} valuePrefix="KES " barClass="bg-brand-red" />
              ) : (
                <EmptyState message="No revenue data for this period." />
              )}
            </AdminCard>
            <AdminCard title="Orders by status" subtitle="All orders in period">
              {statusSeries.length ? (
                <SimpleBarChart data={statusSeries} barClass="bg-neutral-800" />
              ) : (
                <EmptyState message="No orders in this period." />
              )}
            </AdminCard>
          </div>
        </>
      )}

      {tab === 'sales' && (
        <>
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard title="Gross sales" value={formatPrice(salesSummary.total_sales ?? 0)} accent="red" />
            <StatCard title="Orders" value={String(salesSummary.total_orders ?? 0)} accent="sky" />
            <StatCard title="Delivered" value={String(salesSummary.completed_orders ?? 0)} accent="emerald" />
            <StatCard
              title="Avg order value"
              value={formatPrice(salesSummary.average_order_value ?? 0)}
              hint={`${(salesSummary.completion_rate ?? 0).toFixed(1)}% delivery rate`}
              accent="dark"
            />
          </section>

          <div className="grid gap-6 lg:grid-cols-3">
            <AdminCard className="lg:col-span-2" title="Revenue trend" subtitle="Daily gross sales">
              {revenueSeries.length ? (
                <SimpleBarChart data={revenueSeries} valuePrefix="KES " barClass="bg-brand-red" />
              ) : (
                <EmptyState message="No sales in this period." />
              )}
            </AdminCard>
            <AdminCard title="By category" subtitle="Share of revenue">
              {categoryDonut.length ? (
                <SimpleDonut segments={categoryDonut} />
              ) : (
                <EmptyState message="No category breakdown." />
              )}
            </AdminCard>
          </div>

          <AdminCard title="Top products" subtitle="By units sold">
            {(sales?.top_products || []).length ? (
              <AdminTable>
                <AdminTableHead>
                  <AdminTh>Product</AdminTh>
                  <AdminTh className="text-right">Units</AdminTh>
                  <AdminTh className="text-right">Revenue</AdminTh>
                </AdminTableHead>
                <AdminTableBody>
                  {(sales?.top_products || []).map((row) => (
                    <tr key={row.product} className="hover:bg-neutral-50/80">
                      <AdminTd className="font-medium text-neutral-900">{row.product}</AdminTd>
                      <AdminTd className="text-right tabular-nums">{row.quantity}</AdminTd>
                      <AdminTd className="text-right tabular-nums">{formatPrice(row.revenue)}</AdminTd>
                    </tr>
                  ))}
                </AdminTableBody>
              </AdminTable>
            ) : (
              <EmptyState message="No product sales in this period." />
            )}
          </AdminCard>
        </>
      )}

      {tab === 'inventory' && (
        <>
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard title="Total SKUs" value={String(invSummary.total_products ?? 0)} accent="dark" />
            <StatCard title="Low stock" value={String(invSummary.low_stock_products ?? 0)} accent="sky" />
            <StatCard title="Out of stock" value={String(invSummary.out_of_stock_products ?? 0)} accent="red" />
            <StatCard
              title="Stock value"
              value={formatPrice(invSummary.total_stock_value ?? 0)}
              accent="emerald"
            />
          </section>

          <div className="grid gap-6 lg:grid-cols-2">
            <AdminCard title="Stock by category">
              {(inventory?.category_inventory || []).length ? (
                <AdminTable>
                  <AdminTableHead>
                    <AdminTh>Category</AdminTh>
                    <AdminTh className="text-right">SKUs</AdminTh>
                    <AdminTh className="text-right">Units</AdminTh>
                    <AdminTh className="text-right">Value</AdminTh>
                  </AdminTableHead>
                  <AdminTableBody>
                    {(inventory?.category_inventory || []).map((row) => (
                      <tr key={row.category} className="hover:bg-neutral-50/80">
                        <AdminTd className="font-medium">{row.category}</AdminTd>
                        <AdminTd className="text-right tabular-nums">{row.product_count}</AdminTd>
                        <AdminTd className="text-right tabular-nums">{row.total_stock}</AdminTd>
                        <AdminTd className="text-right tabular-nums">{formatPrice(row.stock_value)}</AdminTd>
                      </tr>
                    ))}
                  </AdminTableBody>
                </AdminTable>
              ) : (
                <EmptyState message="No inventory categories." />
              )}
            </AdminCard>

            <AdminCard title="Top movers" subtitle={`Last ${days} days`}>
              {(inventory?.top_movers || []).length ? (
                <AdminTable>
                  <AdminTableHead>
                    <AdminTh>Product</AdminTh>
                    <AdminTh className="text-right">Units sold</AdminTh>
                  </AdminTableHead>
                  <AdminTableBody>
                    {(inventory?.top_movers || []).map((row) => (
                      <tr key={row.product} className="hover:bg-neutral-50/80">
                        <AdminTd className="font-medium">{row.product}</AdminTd>
                        <AdminTd className="text-right tabular-nums">{row.units_sold}</AdminTd>
                      </tr>
                    ))}
                  </AdminTableBody>
                </AdminTable>
              ) : (
                <EmptyState message="No movement data." />
              )}
            </AdminCard>
          </div>

          <AdminCard title="Low stock alert" subtitle={`≤ ${invSummary.low_stock_threshold ?? 5} units`}>
            {(inventory?.low_stock_products || []).length ? (
              <AdminTable>
                <AdminTableHead>
                  <AdminTh>Product</AdminTh>
                  <AdminTh>Category</AdminTh>
                  <AdminTh className="text-right">Stock</AdminTh>
                  <AdminTh className="text-right">Price</AdminTh>
                </AdminTableHead>
                <AdminTableBody>
                  {(inventory?.low_stock_products || []).map((row) => (
                    <tr key={row.product} className="hover:bg-neutral-50/80">
                      <AdminTd className="font-medium">{row.product}</AdminTd>
                      <AdminTd>{row.category}</AdminTd>
                      <AdminTd className="text-right">
                        <span
                          className={
                            row.current_stock === 0
                              ? 'rounded-full bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-700'
                              : 'rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-800'
                          }
                        >
                          {row.current_stock}
                        </span>
                      </AdminTd>
                      <AdminTd className="text-right tabular-nums">{formatPrice(row.price)}</AdminTd>
                    </tr>
                  ))}
                </AdminTableBody>
              </AdminTable>
            ) : (
              <EmptyState message="All products are above the low-stock threshold." />
            )}
          </AdminCard>
        </>
      )}

      {tab === 'customers' && (
        <>
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard title="Total customers" value={String(custSummary.total_customers ?? 0)} accent="dark" />
            <StatCard title="New signups" value={String(custSummary.new_customers ?? 0)} accent="sky" />
            <StatCard title="Active buyers" value={String(custSummary.active_customers ?? 0)} accent="emerald" />
            <StatCard
              title="Repeat rate"
              value={`${(custSummary.retention_rate ?? 0).toFixed(1)}%`}
              hint={`${custSummary.repeat_customers ?? 0} repeat buyers`}
              accent="red"
            />
          </section>

          <div className="grid gap-6 lg:grid-cols-2">
            <AdminCard title="Spend segments" subtitle="Customers with orders in period">
              {(customers?.customer_segments || []).length ? (
                <ul className="space-y-4">
                  {(customers?.customer_segments || []).map((seg) => (
                    <li key={seg.segment}>
                      <div className="mb-1 flex justify-between text-sm">
                        <span className="font-medium text-neutral-800">{seg.segment}</span>
                        <span className="tabular-nums text-neutral-600">{seg.count}</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-neutral-100">
                        <div
                          className="h-full rounded-full bg-brand-red transition-all"
                          style={{ width: `${Math.max((seg.count / segmentMax) * 100, 4)}%` }}
                        />
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <EmptyState message="No customer segments." />
              )}
            </AdminCard>

            <AdminCard title="Order volume" subtitle="Daily orders">
              {orderSeries.length ? (
                <SimpleBarChart data={orderSeries} barClass="bg-sky-500" />
              ) : (
                <EmptyState message="No orders in this period." />
              )}
            </AdminCard>
          </div>

          <AdminCard title="Top customers" subtitle="By spend in period">
            {(customers?.top_customers || []).length ? (
              <AdminTable minWidth="min-w-[720px]">
                <AdminTableHead>
                  <AdminTh>Customer</AdminTh>
                  <AdminTh>Email</AdminTh>
                  <AdminTh className="text-right">Orders</AdminTh>
                  <AdminTh className="text-right">Total spent</AdminTh>
                  <AdminTh className="text-right">AOV</AdminTh>
                </AdminTableHead>
                <AdminTableBody>
                  {(customers?.top_customers || []).map((row) => (
                    <tr key={row.username} className="hover:bg-neutral-50/80">
                      <AdminTd className="font-medium">{row.name}</AdminTd>
                      <AdminTd className="text-neutral-600">{row.email}</AdminTd>
                      <AdminTd className="text-right tabular-nums">{row.order_count}</AdminTd>
                      <AdminTd className="text-right tabular-nums">{formatPrice(row.total_spent)}</AdminTd>
                      <AdminTd className="text-right tabular-nums">{formatPrice(row.avg_order_value)}</AdminTd>
                    </tr>
                  ))}
                </AdminTableBody>
              </AdminTable>
            ) : (
              <EmptyState message="No customer purchases in this period." />
            )}
          </AdminCard>
        </>
      )}

      {tab === 'financial' && (
        <>
          <section className="grid gap-4 sm:grid-cols-3">
            <StatCard title="Revenue" value={formatPrice(finSummary.total_revenue ?? 0)} accent="red" />
            <StatCard title="Paid orders" value={String(finSummary.total_orders ?? 0)} accent="sky" />
            <StatCard
              title="Avg order value"
              value={formatPrice(finSummary.average_order_value ?? 0)}
              accent="emerald"
            />
          </section>

          <div className="grid gap-6 lg:grid-cols-3">
            <AdminCard className="lg:col-span-2" title="Monthly revenue">
              {monthlySeries.length ? (
                <SimpleBarChart data={monthlySeries} valuePrefix="KES " barClass="bg-emerald-600" />
              ) : (
                <EmptyState message="No monthly data." />
              )}
            </AdminCard>
            <AdminCard title="Payment methods" subtitle="By revenue">
              {paymentDonut.length ? (
                <SimpleDonut segments={paymentDonut} />
              ) : (
                <EmptyState message="No payment data." />
              )}
            </AdminCard>
          </div>

          <AdminCard title="Payment status">
            {(financial?.payment_status || []).length ? (
              <AdminTable>
                <AdminTableHead>
                  <AdminTh>Status</AdminTh>
                  <AdminTh className="text-right">Orders</AdminTh>
                  <AdminTh className="text-right">Amount</AdminTh>
                </AdminTableHead>
                <AdminTableBody>
                  {(financial?.payment_status || []).map((row) => (
                    <tr key={row.status} className="hover:bg-neutral-50/80">
                      <AdminTd className="font-medium capitalize">{row.status}</AdminTd>
                      <AdminTd className="text-right tabular-nums">{row.count}</AdminTd>
                      <AdminTd className="text-right tabular-nums">{formatPrice(row.total)}</AdminTd>
                    </tr>
                  ))}
                </AdminTableBody>
              </AdminTable>
            ) : (
              <EmptyState message="No payment status data." />
            )}
          </AdminCard>
        </>
      )}

      <AdminCard title="Export data" subtitle={`CSV downloads for the last ${days} days where applicable`}>
        <div className="grid gap-3 sm:grid-cols-2">
          {EXPORT_TYPES.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between gap-4 rounded-xl border border-neutral-200 bg-neutral-50/50 p-4"
            >
              <div>
                <p className="text-sm font-semibold text-neutral-900">{item.label}</p>
                <p className="mt-0.5 text-xs text-neutral-500">{item.description}</p>
              </div>
              <AdminButton
                variant={item.id === 'sales' ? 'primary' : 'secondary'}
                className="h-9 shrink-0 px-3 text-xs"
                disabled={exporting === item.id}
                onClick={() => handleExport(item.id)}
              >
                {exporting === item.id ? 'Exporting…' : 'CSV'}
              </AdminButton>
            </div>
          ))}
        </div>
      </AdminCard>
    </AdminPage>
  );
}
