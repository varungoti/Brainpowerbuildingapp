FROM node:22-alpine AS build
WORKDIR /app

ARG PUBLIC_APP_DOWNLOAD_IOS
ARG PUBLIC_APP_DOWNLOAD_ANDROID
ARG PUBLIC_APP_WEB_URL
ARG PUBLIC_GROWTH_LEAD_ENDPOINT
ENV PUBLIC_APP_DOWNLOAD_IOS=$PUBLIC_APP_DOWNLOAD_IOS
ENV PUBLIC_APP_DOWNLOAD_ANDROID=$PUBLIC_APP_DOWNLOAD_ANDROID
ENV PUBLIC_APP_WEB_URL=$PUBLIC_APP_WEB_URL
ENV PUBLIC_GROWTH_LEAD_ENDPOINT=$PUBLIC_GROWTH_LEAD_ENDPOINT

COPY package.json astro.config.mjs tailwind.config.mjs tsconfig.json ./
COPY public ./public
COPY src ./src
RUN npm install
RUN npm run build

FROM nginx:1.27-alpine
COPY --from=build /app/dist /usr/share/nginx/html
RUN printf 'server {\n  listen 80;\n  server_name _;\n  root /usr/share/nginx/html;\n  index index.html;\n  location / {\n    try_files $uri $uri/ /index.html;\n  }\n  location = /healthz {\n    add_header Content-Type text/plain;\n    return 200 "ok";\n  }\n}\n' > /etc/nginx/conf.d/default.conf
EXPOSE 80
