# Stage 1: Build the frontend application
FROM node:22-alpine AS builder

ARG PORT=7100
ENV PORT=$PORT

ARG VITE_BACKEND_URL=http://localhost
ENV VITE_BACKEND_URL=$VITE_BACKEND_URL

WORKDIR /app

# Copy root package files to support npm workspaces caching
COPY package.json package-lock.json ./

# Copy frontend workspace package.json
COPY frontend/package.json ./frontend/

# Install dependencies for the workspace
RUN npm ci

# Copy the rest of the application files
COPY frontend/ ./frontend/

# Build the frontend application
RUN npm run frontend:build

# Stage 2: Serve the application using Nginx
FROM nginx:alpine

# Remove default nginx static files
RUN rm -rf /usr/share/nginx/html/*

# Copy build artifacts from builder stage
COPY --from=builder /app/frontend/dist /usr/share/nginx/html

# Copy custom Nginx configuration
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
