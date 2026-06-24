import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { CartProvider } from './context/CartContext.jsx';
import { AdminAuthProvider } from './context/AdminAuthContext.jsx';
import { StoreSettingsProvider } from './context/StoreSettingsContext.jsx';
import { StorefrontBrandsProvider } from './context/StorefrontBrandsContext.jsx';
import { ToastProvider } from './context/ToastContext.jsx';
import { WishlistProvider } from './context/WishlistContext.jsx';
import { CartToastBridge } from './components/CartToastBridge.jsx';
import './index.css';
import App from './App.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <ToastProvider>
        <CartProvider>
          <CartToastBridge />
          <WishlistProvider>
            <StoreSettingsProvider>
              <StorefrontBrandsProvider>
                <AdminAuthProvider>
                  <App />
                </AdminAuthProvider>
              </StorefrontBrandsProvider>
            </StoreSettingsProvider>
          </WishlistProvider>
        </CartProvider>
      </ToastProvider>
    </BrowserRouter>
  </StrictMode>,
);
