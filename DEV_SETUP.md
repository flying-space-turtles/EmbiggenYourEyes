# Development Setup

## Quick Development Setup (Recommended)

### 1. Start Backend Services Only
```bash
# Start only backend services (Django + PostgreSQL)
docker-compose up -d web db
```

### 2. Run Frontend Locally
```bash
cd frontend
npm install
npm run dev
```

This will:
- Start Vite dev server at http://localhost:3000 with hot reload
- Backend API available at http://localhost:8000
- Frontend automatically proxies API calls to backend

### 3. Access Your App
- Frontend: http://localhost:3000 (with hot reload)
- Backend API: http://localhost:8000/api/
- Django Admin: http://localhost:8000/admin/

## Alternative: Full Docker Development

If you prefer everything in Docker:

```bash
# Use development docker-compose
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d frontend-dev web db reverse-proxy
```

This gives you:
- Hot reload through Docker volumes
- Everything containerized
- Access at http://localhost (same as production)

## Benefits of Local Frontend Development

✅ **Instant Hot Reload** - Changes appear immediately
✅ **Better debugging** - Direct access to dev tools
✅ **Faster iteration** - No Docker build times
✅ **IDE integration** - Better TypeScript support

## Switching Between Environments

### Development (Local Frontend)
```bash
docker-compose up -d web db
cd frontend && npm run dev
```

### Production Testing
```bash
docker-compose down
docker-compose up -d
```