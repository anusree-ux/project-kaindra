# ---- Base stage: shared setup ----
FROM node:24-alpine AS base
WORKDIR /app
COPY package*.json ./

# ---- Dev stage ----
FROM base AS dev

RUN npm ci

COPY --chown=node:node . .
USER node

EXPOSE 5000

CMD ["node", "server.js"]
# CMD ["npm", "run", "dev"]

# ---- Production stage ----
FROM base AS production

RUN npm ci --omit=dev

RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodeuser -u 1001 -G nodejs
COPY --chown=nodeuser:nodejs . .

USER nodeuser

EXPOSE 5000

CMD ["node", "server.js"]
# CMD ["npm", "start"]