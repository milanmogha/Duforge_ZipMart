# Build context is the repo root (npm workspaces monorepo — needs the root
# lockfile and packages/shared, which admin-web imports as TS source).
FROM node:20-alpine AS build

WORKDIR /repo
COPY package.json package-lock.json ./
COPY apps/backend/package.json apps/backend/package.json
COPY apps/admin-web/package.json apps/admin-web/package.json
COPY apps/customer-web/package.json apps/customer-web/package.json
COPY apps/shop-web/package.json apps/shop-web/package.json
COPY apps/delivery-web/package.json apps/delivery-web/package.json
COPY packages/shared/package.json packages/shared/package.json
COPY packages/tsconfig/package.json packages/tsconfig/package.json
RUN npm ci

COPY packages packages
COPY apps/admin-web apps/admin-web

ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build -w apps/admin-web

FROM nginx:1.27-alpine
COPY --from=build /repo/apps/admin-web/dist /usr/share/nginx/html
COPY apps/admin-web/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
