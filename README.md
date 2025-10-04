# Embiggen Your Eyes! 👀

## Quick Development Setup (Recommended)

### 1. Start Backend Services Only

```bash
# Start only backend services (Django + PostgreSQL)
docker-compose up -d
```

### 2. Run Frontend Locally

```bash
cd frontend
npm install
npm run dev
```

This will:

- Start Vite dev server at <http://localhost:5173> with instant hot reload
- Backend API available at <http://localhost:8000>
- Frontend automatically proxies API calls to backend via vite.config.ts

### 3. Access Your App

- **Frontend**: <http://localhost:5173> (with instant hot reload ⚡)
- **Backend API**: <http://localhost:8000/api/>
- **Django Admin**: <http://localhost:8000/admin/>

## Benefits of This Setup

✅ **Instant Hot Reload** - Changes appear immediately  
✅ **No Docker Rebuilds** - Frontend changes don't require container rebuilds  
✅ **Better Debugging** - Direct access to React dev tools  
✅ **Faster Development** - No build times for frontend changes  
✅ **IDE Integration** - Full TypeScript support and IntelliSense  

## Development Commands

### Start Development Environment

```bash
# Terminal 1: Start backend services
docker-compose up -d

# Terminal 2: Start frontend dev server
cd frontend && npm run dev
```

### Stop Development Environment

```bash
# Stop Docker services
docker-compose down

# Frontend dev server stops with Ctrl+C
```

### View Logs

```bash
# Backend logs
docker-compose logs -f web

# Frontend logs are in the terminal running npm run dev
```

## Architecture

- **Backend**: Django + PostgreSQL running in Docker containers
- **Frontend**: Vite dev server running directly on your machine
- **Communication**: Vite proxy routes `/api/*` requests to Django backend
- **Hot Reload**: Instant updates for any frontend file changes