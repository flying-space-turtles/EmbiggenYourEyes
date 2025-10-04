#!/usr/bin/env bash
set -e

# Wait for DB to be ready (simple loop)
echo "Waiting for postgres..."
for i in {1..60}; do
  if python - <<'PY' 2>/dev/null
import sys, os, psycopg2
try:
    db = psycopg2.connect(
        dbname=os.getenv('POSTGRES_DB'),
        user=os.getenv('POSTGRES_USER'),
        password=os.getenv('POSTGRES_PASSWORD'),
        host=os.getenv('DB_HOST','db'),
        port=os.getenv('DB_PORT',5432),
        connect_timeout=2
    )
    db.close()
    sys.exit(0)
except Exception:
    sys.exit(1)
PY
  then
    echo "Postgres is up"
    break
  fi
  echo "Postgres not ready, sleeping 1s..."
  sleep 1
done

# Run migrations, collectstatic, create superuser if env provided (optional)
python manage.py migrate --noinput
python manage.py collectstatic --noinput

# optionally create superuser via env vars (UNSECURE for prod; remove if undesired)
if [ -n "$DJANGO_SUPERUSER_EMAIL" ] && [ -n "$DJANGO_SUPERUSER_USERNAME" ] && [ -n "$DJANGO_SUPERUSER_PASSWORD" ]; then
  echo "Creating superuser..."
  python manage.py shell -c "from django.contrib.auth import get_user_model; User = get_user_model(); User.objects.filter(username='$DJANGO_SUPERUSER_USERNAME').exists() or User.objects.create_superuser('$DJANGO_SUPERUSER_USERNAME', '$DJANGO_SUPERUSER_EMAIL', '$DJANGO_SUPERUSER_PASSWORD')"
fi

# Start Gunicorn
exec gunicorn mysite.wsgi:application \
  --bind 0.0.0.0:8000 \
  --workers 3 \
  --log-level info

