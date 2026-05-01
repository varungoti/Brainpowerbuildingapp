FROM node:22-alpine AS build
WORKDIR /app

ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ARG VITE_EDGE_BASE_URL
ARG VITE_POSTIZ_FRONTEND_URL
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY
ENV VITE_EDGE_BASE_URL=$VITE_EDGE_BASE_URL
ENV VITE_POSTIZ_FRONTEND_URL=$VITE_POSTIZ_FRONTEND_URL

COPY package.json tsconfig.json vite.config.ts index.html ./
COPY src ./src
RUN npm install
RUN npm run build

FROM nginx:1.27-alpine
COPY --from=build /app/dist /usr/share/nginx/html
RUN printf 'server {\n  listen 80;\n  server_name _;\n  root /usr/share/nginx/html;\n  index index.html;\n  location / {\n    try_files $uri $uri/ /index.html;\n  }\n  location = /healthz {\n    add_header Content-Type text/plain;\n    return 200 "ok";\n  }\n}\n' > /etc/nginx/conf.d/default.conf
EXPOSE 80
