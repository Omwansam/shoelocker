# ShoeLocker — Production Deployment (danzykicks.com)

Deploy the full stack (PostgreSQL, Flask API, React storefront) on a **Hostinger VPS** with **Cloudflare** in front of **danzykicks.com**.

| Service  | URL                         | Docker port (localhost) |
|----------|-----------------------------|-------------------------|
| Frontend | `https://danzykicks.com`    | `127.0.0.1:8080`        |
| API      | `https://api.danzykicks.com`| `127.0.0.1:5000`        |
| Database | internal only               | not published           |

---

## Architecture

```
Browser
   │
   ▼
Cloudflare (DNS, CDN, DDoS, SSL edge)
   │
   ▼ HTTPS
Host Nginx on VPS (:443)
   ├── danzykicks.com / www  → 127.0.0.1:8080  (frontend container)
   └── api.danzykicks.com    → 127.0.0.1:5000  (backend container)
                                    │
                                    ▼
                              PostgreSQL (internal Docker network)
```

**Secrets never go in Git.** Use `.env` on the VPS only (copy from `.env.example`).

---

## Project layout

```
shoelocker/
├── docker-compose.yml           # Base stack
├── docker-compose.prod.yml      # Production: bind to localhost, disable auto-seed
├── .env.example                 # Safe template (no real secrets)
├── .env                         # Your secrets — create on VPS, gitignored
├── deploy/
│   └── nginx/danzykicks.com.conf
├── BACKEND/Dockerfile
├── foot-locker/Dockerfile
└── DEPLOYMENT.md
```

---

## 1. VPS prerequisites (Hostinger)

SSH into your VPS and install Docker:

```bash
# Ubuntu 22.04/24.04
sudo apt update && sudo apt install -y ca-certificates curl
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER
# Log out and back in so docker group applies
```

Install Nginx:

```bash
sudo apt install -y nginx
```

Open firewall ports:

```bash
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

---

## 2. Cloudflare DNS (danzykicks.com)

In the [Cloudflare dashboard](https://dash.cloudflare.com) for **danzykicks.com**:

### Add the site

1. Add domain → Cloudflare scans existing DNS from True Host.
2. Update nameservers at True Host to the Cloudflare nameservers shown.
3. Wait for activation (usually minutes to a few hours).

### DNS records

| Type | Name | Content        | Proxy status |
|------|------|----------------|--------------|
| A    | `@`  | `<VPS_IP>`     | Proxied (orange cloud) |
| A    | `www`| `<VPS_IP>`     | Proxied |
| A    | `api`| `<VPS_IP>`     | Proxied |

Replace `<VPS_IP>` with your Hostinger VPS public IPv4 address.

### SSL/TLS settings

1. **SSL/TLS → Overview** → set encryption mode to **Full (strict)**.
2. **SSL/TLS → Origin Server** → **Create Certificate**:
   - Hostnames: `danzykicks.com`, `*.danzykicks.com`
   - Validity: 15 years
   - Save the certificate and private key on the VPS only:

```bash
sudo mkdir -p /etc/ssl/cloudflare
sudo nano /etc/ssl/cloudflare/danzykicks.com.pem    # paste certificate
sudo nano /etc/ssl/cloudflare/danzykicks.com.key    # paste private key
sudo chmod 600 /etc/ssl/cloudflare/danzykicks.com.key
```

3. **SSL/TLS → Edge Certificates** → enable **Always Use HTTPS**.

### Recommended Cloudflare settings

- **Speed → Optimization** → Auto Minify (JS, CSS, HTML) optional.
- **Caching** → respect `Cache-Control` from origin for API (`api.danzykicks.com` should not be heavily cached).
- Create a **Cache Rule** for `api.danzykicks.com/*` → Bypass cache (API responses must be fresh).

---

## 3. Clone and configure on the VPS

```bash
git clone <your-repo-url> ~/shoelocker
cd ~/shoelocker
cp .env.example .env
nano .env
```

### Required values in `.env`

Generate secrets:

```bash
python3 -c "import secrets; print(secrets.token_hex(32))"
```

Set these (replace `CHANGE_ME`):

```env
POSTGRES_PASSWORD=<generated>
SECRET_KEY=<generated>
JWT_SECRET_KEY=<generated>
```

Production URLs (already in `.env.example`):

```env
VITE_API_BASE_URL=https://api.danzykicks.com
CORS_ORIGINS=https://danzykicks.com,https://www.danzykicks.com
FRONTEND_URL=https://danzykicks.com
BIND_ADDRESS=127.0.0.1
FRONTEND_PORT=8080
BACKEND_PORT=5000
SEED_ON_START=false
```

> `VITE_API_BASE_URL` is baked into the frontend at **build time**. After changing it, rebuild:
> `docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build frontend`

---

## 4. Start Docker stack (production)

From the project root on your VPS:

```bash
cd ~/shoelocker

docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build

docker compose -f docker-compose.yml -f docker-compose.prod.yml ps
```

### First-time admin user

With `SEED_ON_START=false` (recommended for production):

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml exec backend python seed_admin.py
```

**Change the default admin password immediately** after first login.

For first deploy only, you can set `SEED_ON_START=true`, deploy once, then set it back to `false` and redeploy.

---

## 5. Host Nginx reverse proxy

```bash
sudo cp deploy/nginx/danzykicks.com.conf /etc/nginx/sites-available/danzykicks.com
sudo ln -sf /etc/nginx/sites-available/danzykicks.com /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
```

---

## 6. Verify deployment

```bash
# On VPS (containers healthy)
curl -s http://127.0.0.1:5000/
curl -I http://127.0.0.1:8080/

# Public (after DNS + Cloudflare propagate)
curl -s https://api.danzykicks.com/
curl -I https://danzykicks.com/
```

Open `https://danzykicks.com` in a browser and confirm the storefront loads and API calls go to `https://api.danzykicks.com`.

---

## Environment variables reference

### Secrets (`.env` only — never commit)

| Variable | Purpose |
|----------|---------|
| `POSTGRES_PASSWORD` | Database password |
| `SECRET_KEY` | Flask session signing |
| `JWT_SECRET_KEY` | JWT token signing |
| `MAIL_PASSWORD` | SMTP password |
| `STRIPE_SECRET_KEY` | Stripe API |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhooks |
| `MPESA_CONSUMER_KEY` | Safaricom Daraja |
| `MPESA_CONSUMER_SECRET` | Safaricom Daraja |
| `MPESA_PASSKEY` | M-Pesa STK push |
| `GEMINI_API_KEY` | Google Gemini AI |

### Public / operational config

| Variable | Default | Notes |
|----------|---------|-------|
| `VITE_API_BASE_URL` | — | Public API URL for browser |
| `CORS_ORIGINS` | localhost | Comma-separated frontend origins |
| `FRONTEND_URL` | localhost | Password-reset email links |
| `BIND_ADDRESS` | `0.0.0.0` | Use `127.0.0.1` in production |
| `FRONTEND_PORT` | `80` | Use `8080` when host Nginx uses :80 |
| `BACKEND_PORT` | `5000` | API port on host loopback |
| `SEED_ON_START` | `true` | Set `false` in production |
| `MPESA_CALLBACK_URL` | — | `https://api.danzykicks.com/payments/callback` |

See `.env.example` for the full list.

---

## Common operations

```bash
COMPOSE="docker compose -f docker-compose.yml -f docker-compose.prod.yml"

# Logs
$COMPOSE logs -f backend
$COMPOSE logs -f frontend

# Rebuild after code changes
$COMPOSE up -d --build

# Rebuild frontend after URL change
$COMPOSE up -d --build frontend

# Run migrations
$COMPOSE exec backend flask db upgrade

# Stop stack
$COMPOSE down

# Stop and wipe data (destructive)
$COMPOSE down -v
```

---

## Security checklist

- [ ] `.env` exists only on the VPS, never committed
- [ ] `BIND_ADDRESS=127.0.0.1` so Docker ports are not public
- [ ] Cloudflare SSL mode is **Full (strict)**
- [ ] Origin certificate stored at `/etc/ssl/cloudflare/` with `600` on the key
- [ ] `SEED_ON_START=false` after initial setup
- [ ] Admin password changed from default
- [ ] `CORS_ORIGINS` lists only your real frontend domains
- [ ] Back up `postgres_data` and `uploads_data` Docker volumes regularly

---

## Troubleshooting

### `Set POSTGRES_PASSWORD in .env`

Create `.env` from `.env.example` and set `POSTGRES_PASSWORD`, `SECRET_KEY`, and `JWT_SECRET_KEY`.

### Frontend API errors / CORS

1. Confirm `VITE_API_BASE_URL=https://api.danzykicks.com`
2. Rebuild frontend: `$COMPOSE up -d --build frontend`
3. Confirm `CORS_ORIGINS` includes `https://danzykicks.com`

### Cloudflare 522 / connection timed out

- VPS firewall allows 80/443
- Nginx is running: `sudo systemctl status nginx`
- Docker containers healthy: `$COMPOSE ps`

### Cloudflare 525 / SSL handshake failed

- Origin certificate installed correctly
- Cloudflare SSL mode is **Full (strict)**, not Flexible

### Port conflicts on VPS

If port 80 is used by Nginx and Docker tries to bind 80, use production compose (`FRONTEND_PORT=8080`).

---

## Local development (without production overlay)

```bash
cp .env.example .env
# Edit for local URLs:
#   VITE_API_BASE_URL=http://localhost:5000
#   CORS_ORIGINS=http://localhost:5173,http://localhost:3000

docker compose up -d --build
```

For frontend dev with hot reload, run `npm run dev` in `foot-locker/` separately.
