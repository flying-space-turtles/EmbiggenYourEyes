# frontend/Dockerfile

# 1) build stage
FROM node:24-alpine AS build
WORKDIR /app

# Accept build argument for Cesium token
ARG VITE_CESIUM_ION_ACCESS_TOKEN
ENV VITE_CESIUM_ION_ACCESS_TOKEN=$VITE_CESIUM_ION_ACCESS_TOKEN

COPY package.json package-lock.json* pnpm-lock.yaml* ./
# choose npm/yarn/pnpm accordingly (this example uses npm)
RUN npm ci
COPY . .
RUN npm run build

# 2) production nginx stage
FROM nginx:stable-alpine
COPY --from=build /app/dist /usr/share/nginx/html
# remove default nginx config if you want and use custom (optional)
# expose port 80
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

