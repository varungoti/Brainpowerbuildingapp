# Studio orchestrator + Remotion renderer
# Headless Chromium for Remotion rendering needs the chromium dependencies.
FROM node:20-bookworm-slim

WORKDIR /app

# Chromium runtime deps for Remotion (puppeteer-chromium-resolver compatible)
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates fonts-liberation libasound2 libatk-bridge2.0-0 libatk1.0-0 \
    libcups2 libdbus-1-3 libdrm2 libgbm1 libgtk-3-0 libnspr4 libnss3 libwayland-client0 \
    libx11-xcb1 libxcomposite1 libxdamage1 libxext6 libxfixes3 libxrandr2 xdg-utils \
    libxkbcommon0 libxshmfence1 libglib2.0-0 wget chromium ffmpeg \
  && rm -rf /var/lib/apt/lists/*

ENV REMOTION_CHROME_EXECUTABLE_PATH=/usr/bin/chromium

COPY package.json tsconfig.json remotion.config.ts ./
RUN npm install --production=false
COPY src ./src
COPY server ./server

EXPOSE 4400
ENV NODE_ENV=production
CMD ["npx","tsx","server/index.ts"]
