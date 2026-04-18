# ── Build stage ──────────────────────────────────────────────────────────────
FROM node:25-alpine3.23 AS builder

WORKDIR /app

RUN npm install -g pnpm@10.18.1

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .

ENV VITE_API_URL=/api
RUN pnpm run build

# ── Production stage (nginx) ──────────────────────────────────────────────────
FROM nginx:stable-alpine AS production

COPY --from=builder /app/dist /usr/share/nginx/html

# SPA fallback — route all requests to index.html for client-side routing
# Copy as a template — nginx processes it at startup and substitutes ${BACKEND_URL}
COPY nginx.conf /etc/nginx/templates/default.conf.template

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
