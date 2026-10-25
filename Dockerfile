# ---------- deps ----------
FROM node:22-alpine AS deps
WORKDIR /app
RUN apk add --no-cache libc6-compat openssl
COPY package.json package-lock.json ./
COPY prisma ./prisma
RUN npm ci --no-audit --no-fund

# ---------- build ----------
FROM node:22-alpine AS builder
WORKDIR /app
RUN apk add --no-cache libc6-compat openssl
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate && npx next build && npm prune --omit=dev

# ---------- runtime ----------
FROM node:22-alpine AS runner
WORKDIR /app
# fontconfig + font: để sharp vẽ chữ trong ảnh minh họa của seed demo
RUN apk add --no-cache libc6-compat openssl tini fontconfig ttf-dejavu \
  && addgroup -S -g 1001 app && adduser -S -u 1001 -G app app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0 \
    UPLOAD_DIR=/app/storage/media

COPY --from=builder --chown=app:app /app/package.json ./package.json
COPY --from=builder --chown=app:app /app/next.config.mjs ./next.config.mjs
COPY --from=builder --chown=app:app /app/node_modules ./node_modules
COPY --from=builder --chown=app:app /app/.next ./.next
COPY --from=builder --chown=app:app /app/public ./public
COPY --from=builder --chown=app:app /app/prisma ./prisma
COPY --from=builder --chown=app:app /app/assets ./assets
# seed.ts dùng src/lib/media.ts
COPY --from=builder --chown=app:app /app/src/lib ./src/lib
COPY --from=builder --chown=app:app /app/tsconfig.json ./tsconfig.json

RUN mkdir -p /app/storage/media && chown -R app:app /app/storage
USER app
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/api/health || exit 1
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node_modules/.bin/next", "start"]
