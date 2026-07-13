# Stage 1: Build React Application
FROM node:18-alpine AS build

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

# Build the app (produces build/ folder)
RUN npm run build

# Stage 2: Serve React Application with Nginx
FROM nginx:alpine

# Copy built assets from builder stage
COPY --from=build /app/build /usr/share/nginx/html

# Copy custom nginx configuration if needed, or use default
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
