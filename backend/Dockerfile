# ---- Base stage: shared setup ----
FROM node:24-alpine AS base
WORKDIR /app
COPY package*.json ./

# ---- Dev stage ----
FROM base AS dev
RUN npm ci
COPY . .
EXPOSE 5000
CMD ["npm", "run", "dev"]

# ---- Production stage ----
FROM base AS production
ENV NODE_ENV=production
RUN npm ci --omit=dev
COPY --chown=node:node . .
USER node
EXPOSE 5000
CMD ["node", "server.js"]