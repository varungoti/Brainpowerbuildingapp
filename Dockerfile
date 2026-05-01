FROM node:22-alpine AS build
WORKDIR /app

RUN corepack enable

COPY package.json pnpm-lock.yaml .npmrc tsconfig.json vite.config.ts index.html ./
COPY capacitor-plugins ./capacitor-plugins
COPY public ./public
COPY scripts ./scripts
COPY src ./src

RUN pnpm install --frozen-lockfile
RUN pnpm run build

FROM nginx:1.27-alpine
COPY --from=build /app/dist /usr/share/nginx/html
RUN printf 'server {\n  listen 80;\n  server_name _;\n  root /usr/share/nginx/html;\n  index index.html;\n  location / {\n    try_files $uri $uri/ /index.html;\n  }\n  location = /healthz {\n    add_header Content-Type text/plain;\n    return 200 "ok";\n  }\n}\n' > /etc/nginx/conf.d/default.conf
EXPOSE 80
