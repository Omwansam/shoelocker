const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000').replace(/\/+$/, '');

function notifyAuthChange() {
  try {
    globalThis.dispatchEvent(new CustomEvent('shoelocker-auth-changed'));
  } catch {
    //
  }
}

export function clearAuthStorage() {
  localStorage.removeItem('token');
  localStorage.removeItem('adminToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
  notifyAuthChange();
}

function toErrorMessage(payload, fallback) {
  if (!payload || typeof payload !== 'object') return fallback;
  return payload.error || payload.message || fallback;
}

export async function loginRequest(email, password) {
  console.log('[Auth] Login attempt for:', email);
  const res = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const payload = await res.json().catch(() => ({}));
  
  console.log('[Auth] Login response status:', res.status);
  console.log('[Auth] Login response payload keys:', Object.keys(payload));
  console.log('[Auth] Login response:', {
    status: res.status,
    ok: res.ok,
    hasAccessToken: !!payload.access_token,
    accessTokenLength: payload.access_token ? payload.access_token.length : 0,
    hasRefreshToken: !!payload.refresh_token,
    hasUser: !!payload.user,
    userData: payload.user ? { id: payload.user.id, email: payload.user.email, is_admin: payload.user.is_admin } : null,
  });
  
  if (!res.ok) {
    console.error('[Auth] Login failed with status:', res.status);
    throw new Error(toErrorMessage(payload, 'Login failed'));
  }

  if (payload.access_token) {
    console.log('[Auth] Saving tokens to localStorage...');
    localStorage.setItem('token', payload.access_token);
    console.log('[Auth] Saved "token" - verification:', !!localStorage.getItem('token'));
    
    if (payload.refresh_token) {
      localStorage.setItem('refreshToken', payload.refresh_token);
      console.log('[Auth] Saved "refreshToken" - verification:', !!localStorage.getItem('refreshToken'));
    }
    
    if (payload.user?.is_admin) {
      localStorage.setItem('adminToken', payload.access_token);
      console.log('[Auth] Saved "adminToken" - verification:', !!localStorage.getItem('adminToken'));
    }
    
    if (payload.user) {
      localStorage.setItem('user', JSON.stringify(payload.user));
      console.log('[Auth] Saved "user" - verification:', !!localStorage.getItem('user'));
    }
    
    console.log('[Auth] All localStorage keys after login:', Object.keys(localStorage));
    notifyAuthChange();
  } else {
    console.error('[Auth] No access_token in response! Full payload:', payload);
  }

  return payload;
}

export async function registerRequest(input) {
  const res = await fetch(`${API_BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  const payload = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(toErrorMessage(payload, 'Registration failed'));
  return payload;
}
