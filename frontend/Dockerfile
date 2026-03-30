# Stage 1: Build the React application
FROM node:20-slim AS builder

WORKDIR /app

# Install pnpm to ensure exact parity with local lockfiles
RUN npm install -g pnpm

# Install project dependencies
COPY package.json pnpm-lock.yaml ./
RUN pnpm install

# Build the frontend artifacts
COPY . .
RUN pnpm run build

# Stage 2: Serve the application via Nginx
FROM nginx:alpine

# Copy the generated custom Nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy compiled React static files into Nginx public folder
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose port 80
EXPOSE 80

# Run nginx indefinitely
CMD ["nginx", "-g", "daemon off;"]
