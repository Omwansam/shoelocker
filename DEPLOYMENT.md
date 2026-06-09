# ShoeLocker — Docker Deployment Guide

This guide explains how to deploy ShoeLocker on a VPS using Docker and Docker Compose. The stack runs three services:

| Service  | Technology        | Default port | Description              |
|----------|-------------------|--------------|--------------------------|
| `db`     | PostgreSQL 16     | internal     | Application database     |
| `backend`| Flask + Gunicorn  | 5000         | REST API                 |
| `frontend` | React + Nginx   | 80           | Storefront & admin UI    |

---

## Project layout

```
shoelocker/
├── docker-compose.yml          # Orchestrates all services
├── DEPLOYMENT.md               # This file
├── .env                        # Secrets (create on VPS, never commit)
│
├── BACKEND/
│   ├── Dockerfile              # Backend image definition
│   ├── docker-entrypoint.sh    # Startup: wait for DB → migrate → serve
│   ├── requirements.txt        # Python dependencies
│   ├── .dockerignore           # Files excluded from backend image
│   └── server/                 # Flask application
│
└── foot-locker/
    ├── Dockerfile              # Frontend image (build + Nginx)
    ├── nginx.conf              # Nginx config for the React SPA
    ├── .dockerignore           # Files excluded from frontend image
    └── src/                    # React application
```

---

## Prerequisites

On your VPS, install:

- [Docker](https://docs.docker.com/engine/install/)
- [Docker Compose](https://docs.docker.com/compose/install/) (v2+)

Clone the repository:

```bash
git clone <your-repo-url> shoelocker
cd shoelocker
```

---

## Environment variables

Create a `.env` file in the project root. This file is **gitignored** and must never be committed.

### Required

```env
POSTGRES_PASSWORD=change-me-strong-password
SECRET_KEY=change-me-secret-key
JWT_SECRET_KEY=change-me-jwt-secret-key
```

Generate random secrets:

```bash
python3 -c "import secrets; print(secrets.token_hex(32))"
```

### Production URLs

```env
# Public API URL — must be reachable from the user's browser
VITE_API_BASE_URL=https://api.yourdomain.com

# Origins allowed by Flask-CORS (comma-separated)
CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

> **Important:** `VITE_API_BASE_URL` is baked into the frontend at **build time**. After changing it, rebuild the frontend:
>
> ```bash
> docker compose up -d --build frontend
> ```

### Optional

```env
# Database
POSTGRES_USER=shoelocker
POSTGRES_DB=shoelocker

# Host ports
FRONTEND_PORT=80
BACKEND_PORT=5000

# Gunicorn
GUNICORN_WORKERS=4
GUNICORN_TIMEOUT=120

# Frontend
VITE_USE_MOCK_API=false

# Email
MAIL_SERVER=smtp.example.com
MAIL_PORT=587
MAIL_USE_TLS=true
MAIL_USERNAME=
MAIL_PASSWORD=
MAIL_DEFAULT_SENDER=noreply@shoelocker.ke

# Stripe
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=

# M-Pesa
MPESA_CONSUMER_KEY=
MPESA_CONSUMER_SECRET=
MPESA_SHORTCODE=
MPESA_PASSKEY=
MPESA_CALLBACK_URL=
MPESA_ENVIRONMENT=sandbox
```

---

## How each service works

### Database (`db`)

- Runs PostgreSQL 16 Alpine.
- Data is stored in the `postgres_data` Docker volume (survives container restarts).
- Not exposed to the public internet — only reachable inside the `shoelocker` network.
- A health check ensures the backend waits until Postgres is ready.

### Backend (`backend`)

**Dockerfile** (`BACKEND/Dockerfile`):

1. Uses Python 3.12 slim.
2. Installs dependencies from `requirements.txt` (includes Gunicorn and `psycopg2-binary`).
3. Copies the Flask app from `server/`.
4. Exposes port `5000`.

**Startup** (`docker-entrypoint.sh`):

1. Waits for PostgreSQL to accept connections (up to 60 seconds).
2. Runs `flask db upgrade` to apply database migrations.
3. Starts Gunicorn with 4 workers (configurable via `GUNICORN_WORKERS`).

**Persistent storage:**

- Product uploads are stored in the `uploads_data` volume at `/app/server/static/uploads`.

### Frontend (`frontend`)

**Dockerfile** (`foot-locker/Dockerfile`) — two stages:

1. **Build stage** — Node 20 installs dependencies and runs `npm run build`, injecting `VITE_API_BASE_URL`.
2. **Serve stage** — Nginx Alpine serves the built static files from `/usr/share/nginx/html`.

**Nginx** (`foot-locker/nginx.conf`):

- Serves the React SPA.
- Routes unknown paths to `index.html` (required for React Router).
- Enables gzip and caches static assets for 7 days.

---

## Deploy

### First-time setup

```bash
# 1. Create .env with your secrets and URLs (see above)

# 2. Build and start all services
docker compose up -d --build

# 3. Check status
docker compose ps

# 4. View logs
docker compose logs -f
```

### Seed data (first run only)

```bash
# Create admin user
docker compose exec backend python seed_admin.py

# Optional: seed products
docker compose exec backend python seed_products.py
```

### Verify

```bash
# API health
curl http://localhost:5000/

# Frontend
curl -I http://localhost/
```

---

## Common operations

```bash
# Stop all services
docker compose down

# Stop and remove volumes (⚠️ deletes database and uploads)
docker compose down -v

# Rebuild after code changes
docker compose up -d --build

# Rebuild only the backend
docker compose up -d --build backend

# Rebuild only the frontend (e.g. after changing VITE_API_BASE_URL)
docker compose up -d --build frontend

# Run migrations manually
docker compose exec backend flask db upgrade

# Open a shell inside the backend container
docker compose exec backend sh

# Tail backend logs
docker compose logs -f backend
```

---

## Production VPS setup (HTTPS)

Docker exposes ports `80` (frontend) and `5000` (backend). For production, put a reverse proxy in front for HTTPS.

### Example with Caddy

```
yourdomain.com {
    reverse_proxy localhost:80
}

api.yourdomain.com {
    reverse_proxy localhost:5000
}
```

Set in `.env`:

```env
VITE_API_BASE_URL=https://api.yourdomain.com
CORS_ORIGINS=https://yourdomain.com
```

Then rebuild the frontend:

```bash
docker compose up -d --build frontend
```

### Example with Nginx on the host

```nginx
# /etc/nginx/sites-available/shoelocker

server {
    listen 443 ssl;
    server_name yourdomain.com;

    ssl_certificate     /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:80;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}

server {
    listen 443 ssl;
    server_name api.yourdomain.com;

    ssl_certificate     /etc/letsencrypt/live/api.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.yourdomain.com/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

Obtain certificates with [Certbot](https://certbot.eff.org/):

```bash
sudo certbot --nginx -d yourdomain.com -d api.yourdomain.com
```

---

## Security notes

- **Never commit `.env`** — it is listed in `.gitignore` at the repo root and in both `BACKEND/` and `foot-locker/` gitignore files.
- **Change default passwords** before going live.
- **Use HTTPS** in production — set `VITE_API_BASE_URL` and `CORS_ORIGINS` to your `https://` domains.
- **Postgres is internal** — only the backend container can reach it over the Docker network.
- **Uploads persist** in the `uploads_data` volume — back this up alongside `postgres_data`.

---

## Troubleshooting

### `Set POSTGRES_PASSWORD in .env`

Create a `.env` file in the project root with at least `POSTGRES_PASSWORD`, `SECRET_KEY`, and `JWT_SECRET_KEY`.

### Port already in use

```bash
# Find what is using the port
fuser -v 5000/tcp
fuser -v 80/tcp

# Stop the process or change ports in .env
BACKEND_PORT=5001
FRONTEND_PORT=8080
```

### Backend fails to start / migration errors

```bash
docker compose logs backend
docker compose exec backend flask db upgrade
```

### Frontend shows API errors

1. Confirm `VITE_API_BASE_URL` points to the public API URL (not `http://db:5432` or an internal Docker hostname).
2. Rebuild the frontend after changing it: `docker compose up -d --build frontend`.
3. Confirm `CORS_ORIGINS` includes your frontend domain.

### Database connection refused

The entrypoint waits up to 60 seconds for Postgres. If it still fails:

```bash
docker compose ps          # db should be "healthy"
docker compose logs db
```

### Reset everything

```bash
docker compose down -v
docker compose up -d --build
docker compose exec backend python seed_admin.py
```

---

## Architecture diagram

```
                    ┌─────────────────────────────────────┐
                    │              VPS                     │
                    │                                      │
  Browser ──HTTPS──►  Reverse proxy (Caddy / Nginx)       │
                    │         │              │             │
                    │         ▼              ▼             │
                    │   ┌──────────┐  ┌──────────┐        │
                    │   │ frontend │  │ backend  │        │
                    │   │  Nginx   │  │ Gunicorn │        │
                    │   │  :80     │  │  :5000   │        │
                    │   └──────────┘  └────┬─────┘        │
                    │                        │               │
                    │                   ┌────▼─────┐        │
                    │                   │    db    │        │
                    │                   │ Postgres │        │
                    │                   │ (internal)│        │
                    │                   └──────────┘        │
                    │                                      │
                    │   Volumes: postgres_data, uploads_data │
                    └─────────────────────────────────────┘
```
