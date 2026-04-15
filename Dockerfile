FROM node:20-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm install --include=optional

COPY . .
RUN npm run build

FROM node:20-alpine
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8080

COPY package*.json ./
RUN npm install --omit=dev --include=optional && npm cache clean --force

COPY --from=build /app/dist ./dist
COPY --from=build /app/server.js ./server.js
COPY --from=build /app/server ./server

EXPOSE 8080
CMD ["npm", "run", "start"]
