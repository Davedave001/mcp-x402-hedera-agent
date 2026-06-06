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

# At container start, substitute AGENT_BACKEND_URL into the nginx config,
# then launch nginx. Only ${AGENT_BACKEND_URL} is replaced — nginx's own
# $variables (like $uri, $http_host) are left untouched.
CMD ["/bin/sh", "-c", \
  "envsubst '${AGENT_BACKEND_URL}' < /etc/nginx/conf.d/default.conf.template > /etc/nginx/conf.d/default.conf \
  && nginx -g 'daemon off;'"]

EXPOSE 80
