# ── Stage 1: build ──────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

COPY package.json ./
RUN npm install

COPY . .

# Bake the agent URL into the bundle at build time.
# nginx also proxies /agent/* as a fallback for same-origin requests.
# Set VITE_AGENT_URL as a Build Argument in Coolify to the HTTPS agent URL.
ARG VITE_AGENT_URL=https://pw8wwc0gkc0w880w8w4gscsc.72.62.37.229.sslip.io
ENV VITE_AGENT_URL=${VITE_AGENT_URL}

RUN npm run build

# ── Stage 2: serve with nginx ────────────────────────────────
FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
