# ── Stage 1: build ──────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

COPY package.json ./
RUN npm install

COPY . .

# Bake the agent URL into the bundle at build time.
# nginx also proxies /agent/* as a fallback for same-origin requests.
# Set VITE_AGENT_URL as a Build Argument in Coolify to the HTTPS agent URL.
# Empty = same-origin relative URLs; nginx proxy forwards to the agent
ARG VITE_AGENT_URL=""
ENV VITE_AGENT_URL=${VITE_AGENT_URL}

RUN npm run build

# ── Stage 2: serve with nginx ────────────────────────────────
FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
