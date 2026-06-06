# ── Stage 1: build ──────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

COPY package.json ./
RUN npm install

COPY . .

ARG VITE_AGENT_URL=""
ENV VITE_AGENT_URL=$VITE_AGENT_URL

RUN npm run build

# ── Stage 2: serve with nginx ────────────────────────────────
FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf.template /etc/nginx/conf.d/default.conf.template

# Bake the agent backend URL into nginx.conf at build time.
# Default points to the Coolify-internal agent URL.
# Override with --build-arg AGENT_BACKEND_URL=... if it ever changes.
ARG AGENT_BACKEND_URL=http://pw8wwc0gkc0w880w8w4gscsc.72.62.37.229.sslip.io
RUN envsubst '${AGENT_BACKEND_URL}' \
      < /etc/nginx/conf.d/default.conf.template \
      > /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
