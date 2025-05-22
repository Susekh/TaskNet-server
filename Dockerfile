# Use official Node.js image
FROM node:slim

# Create app directory
WORKDIR /app

# Install dependencies
COPY package*.json ./
COPY tsconfig.json ./
RUN npm install

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# Expose port (change if needed)
EXPOSE 8000

# Run the app
CMD ["npm", "start"]
