# ── Stage 1: build ──────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

COPY package.json ./
RUN npm install

COPY . .

# VITE_ vars baked at build time — leave empty; nginx proxy handles routing
ARG VITE_AGENT_URL=""
ENV VITE_AGENT_URL=$VITE_AGENT_URL

RUN npm run build

# ── Stage 2: serve with nginx ────────────────────────────────
FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf.template /etc/nginx/conf.d/default.conf.template
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

# AGENT_BACKEND_URL must be set as a container environment variable.
# The entrypoint substitutes it into nginx.conf.template at startup.
EXPOSE 80
ENTRYPOINT ["/docker-entrypoint.sh"]
