#!/bin/sh
set -e

echo "Waiting for PostgreSQL..."
python <<'PY'
import os
import sys
import time

import psycopg2

database_url = os.environ.get("DATABASE_URL")
if not database_url:
    sys.exit("DATABASE_URL is not set")

for attempt in range(30):
    try:
        conn = psycopg2.connect(database_url)
        conn.close()
        break
    except psycopg2.OperationalError:
        if attempt == 29:
            sys.exit("Database is not ready")
        time.sleep(2)
PY

echo "Running database migrations..."
flask db upgrade

echo "Seeding catalog and demo analytics data (if needed)..."
python seed_products.py 2>/dev/null || true
python seed_admin.py 2>/dev/null || true
python seed_demo_data.py 2>/dev/null || true

echo "Starting Gunicorn..."
exec gunicorn \
  --bind 0.0.0.0:5000 \
  --workers "${GUNICORN_WORKERS:-4}" \
  --timeout "${GUNICORN_TIMEOUT:-120}" \
  --access-logfile - \
  --error-logfile - \
  "app:app"
