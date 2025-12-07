### Build stage
FROM node:18-alpine AS builder
WORKDIR /app

# copy package files first for better caching
COPY frontend/package*.json ./
COPY frontend/pnpm-lock.yaml ./
RUN npm ci

# copy rest of frontend sources and build
COPY frontend/ .
RUN npm run build

### Production stage (nginx)
FROM nginx:stable-alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
