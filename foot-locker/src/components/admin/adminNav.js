/** @typedef {'pendingOrders' | 'lowStock'} AdminBadgeKey */

/**
 * @typedef {{
 *   to: string,
 *   label: string,
 *   icon: string,
 *   badgeKey?: AdminBadgeKey,
 *   end?: boolean,
 * }} AdminNavItem
 */

/** @type {{ section: string, items: AdminNavItem[] }[]} */
export const ADMIN_NAV_SECTIONS = [
  {
    section: 'Overview',
    items: [
      { to: '/admin/dashboard', label: 'Dashboard', icon: 'dashboard', end: true },
      { to: '/admin/analytics', label: 'Analytics', icon: 'analytics' },
    ],
  },
  {
    section: 'Commerce',
    items: [
      { to: '/admin/orders', label: 'Orders', icon: 'orders', badgeKey: 'pendingOrders' },
      { to: '/admin/products', label: 'Products', icon: 'products', badgeKey: 'lowStock' },
      { to: '/admin/customers', label: 'Customers', icon: 'customers' },
      { to: '/admin/promotions', label: 'Promotions', icon: 'promotions' },
      { to: '/admin/suppliers', label: 'Suppliers', icon: 'suppliers' },
    ],
  },
  {
    section: 'Growth',
    items: [
      { to: '/admin/content', label: 'Content', icon: 'content' },
      { to: '/admin/brands', label: 'Brand wall', icon: 'products' },
      { to: '/admin/reports', label: 'Reports', icon: 'reports' },
    ],
  },
  {
    section: 'System',
    items: [
      { to: '/admin/team', label: 'Team', icon: 'team' },
      { to: '/admin/settings', label: 'Settings', icon: 'settings' },
    ],
  },
];

/** @type {Record<string, string>} */
export const ADMIN_ROUTE_TITLES = {
  dashboard: 'Dashboard',
  analytics: 'Analytics',
  orders: 'Orders',
  products: 'Products',
  customers: 'Customers',
  promotions: 'Promotions',
  suppliers: 'Suppliers',
  content: 'Content',
  brands: 'Brand wall',
  reports: 'Reports',
  team: 'Team',
  settings: 'Settings',
  new: 'New product',
  edit: 'Edit product',
};
