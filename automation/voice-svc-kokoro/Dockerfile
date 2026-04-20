# Multi-stage: Kokoro-FastAPI as upstream + our auth proxy as the public face.
# In production we run them as TWO containers behind one Railway service so
# the GPU container stays simple. This Dockerfile is for the proxy only.

FROM node:20-alpine
WORKDIR /app
COPY package.json tsconfig.json ./
RUN npm install --production=false
COPY src ./src
ENV NODE_ENV=production
EXPOSE 8880
CMD ["npx","tsx","src/index.ts"]
