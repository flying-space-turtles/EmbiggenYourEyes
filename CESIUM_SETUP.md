# 🌍 EmbiggenYourEyes - CesiumJS Globe Setup

## Getting Your Cesium Ion Access Token

To use the 3D globe visualization, you'll need a free Cesium Ion access token:

### Step 1: Create a Cesium Ion Account
1. Go to [https://cesium.com/ion/](https://cesium.com/ion/)
2. Click "Sign up" to create a free account
3. Verify your email address

### Step 2: Get Your Access Token
1. Log in to your Cesium Ion account
2. Go to [https://cesium.com/ion/tokens](https://cesium.com/ion/tokens)
3. Click "Create token"
4. Give it a name like "EmbiggenYourEyes Development"
5. Leave the default scopes (they're fine for basic usage)
6. Click "Create"
7. Copy the token that appears

### Step 3: Add Token to Your Environment
1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and replace `your-cesium-ion-token-here` with your actual token:
   ```bash
   VITE_CESIUM_ION_ACCESS_TOKEN=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

### Step 4: Rebuild and Start
```bash
# Rebuild the frontend with the token
docker-compose build frontend

# Start all services
docker-compose up -d
```

## What You Get With the Token

- High-resolution satellite imagery from Bing Maps
- Terrain data for 3D elevation
- Access to Cesium World Imagery
- Better performance and visual quality

## Free Tier Limits

Cesium Ion's free tier includes:
- 5 GB of storage
- 50,000 requests per month
- Access to global base maps and terrain

This is more than enough for development and small projects!

## Troubleshooting

If you see a "This application does not have permission to use this asset" error:
1. Make sure your token is correctly set in `.env`
2. Check that you copied the token completely (they're quite long)
3. Verify the token hasn't expired in your Cesium Ion dashboard

## Alternative: Use Without Token

If you don't want to set up a token, the globe will still work but with:
- Lower resolution imagery
- No terrain data (flat globe)
- Cesium branding/watermark

The NASA facility markers and basic globe functionality will still work perfectly!