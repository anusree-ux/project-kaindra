FROM node:24-alpine AS base
WORKDIR /app
RUN chown node:node /app
COPY package*.json ./

# ---- Dev stage ----
FROM base AS dev
USER node
RUN npm ci
COPY --chown=node:node . .
EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host"]

# ---- Build stage (for production) ----
FROM base AS build
RUN npm ci
COPY . .
RUN npm run build

# ---- Production stage ----
FROM nginxinc/nginx-unprivileged:alpine AS production
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]