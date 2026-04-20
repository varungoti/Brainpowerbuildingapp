FROM node:20-alpine
WORKDIR /app
COPY package.json tsconfig.json ./
RUN npm install --production=false
COPY src ./src
ENV NODE_ENV=production
EXPOSE 4401
CMD ["npx","tsx","src/index.ts"]
