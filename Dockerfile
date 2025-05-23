# Use official Node.js image
FROM node:24-slim

# Install OpenSSL (required for Prisma on Linux)
RUN apt-get update && apt-get install -y openssl

# Create app directory
WORKDIR /app

# Install dependencies
COPY package*.json ./
COPY tsconfig.json ./
RUN npm install

# Copy source code
COPY . .

# 👇 Generate Prisma client (AFTER copying the code and installing dependencies)
RUN npx prisma generate

# Build TypeScript
RUN npm run build

# Expose port (change if needed)
EXPOSE 8000

# Run the app
CMD ["npm", "start"]
