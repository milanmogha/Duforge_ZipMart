# Build context is the repo root (npm workspaces monorepo — needs the root lockfile).
FROM node:20-alpine

WORKDIR /repo
COPY package.json package-lock.json ./
COPY apps/backend/package.json apps/backend/package.json
COPY apps/admin-web/package.json apps/admin-web/package.json
COPY apps/customer-web/package.json apps/customer-web/package.json
COPY apps/shop-web/package.json apps/shop-web/package.json
COPY apps/delivery-web/package.json apps/delivery-web/package.json
COPY packages/shared/package.json packages/shared/package.json
COPY packages/tsconfig/package.json packages/tsconfig/package.json
RUN npm ci --omit=dev

COPY apps/backend apps/backend

WORKDIR /repo/apps/backend
EXPOSE 8000
CMD ["node", "index.js"]
