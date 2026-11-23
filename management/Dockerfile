FROM node:24-bookworm-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY assets/favicon.svg ./assets/favicon.svg
COPY management ./management
RUN npm run management:build

FROM node:24-bookworm-slim AS runtime
ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=8787 \
    OPENMATH_DB=/var/lib/openmath/openmath.sqlite
WORKDIR /app
RUN mkdir -p /var/lib/openmath && chown node:node /var/lib/openmath
COPY --from=build --chown=node:node /app/package.json ./package.json
COPY --from=build --chown=node:node /app/management/server ./management/server
COPY --from=build --chown=node:node /app/management/dist ./management/dist
COPY --from=build --chown=node:node /app/management/scripts ./management/scripts
COPY --from=build --chown=node:node /app/management/seed-projects.json ./management/seed-projects.json
USER node
EXPOSE 8787
HEALTHCHECK --interval=30s --timeout=6s --start-period=15s --retries=3 \
  CMD ["node", "management/scripts/healthcheck.mjs"]
CMD ["node", "management/server/start.mjs"]
