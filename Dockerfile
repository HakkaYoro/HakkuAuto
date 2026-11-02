# ---- build: webui (vite) + server (tsc) ----
FROM node:26-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY . .
RUN npm run build

# ---- run: production deps + compiled output ----
FROM node:26-alpine
ENV NODE_ENV=production DATA_DIR=/data PORT=3000
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --no-audit --no-fund \
    && mkdir -p /data && chown node:node /data
COPY --from=build /app/dist ./dist
USER node
VOLUME /data
EXPOSE 3000
CMD ["node", "dist/main.js"]
