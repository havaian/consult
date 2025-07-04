# backend/Dockerfile
FROM node:20-alpine

WORKDIR /usr/src/app

# Install dependencies
COPY package*.json ./
RUN npm ci --omit=dev

# Copy source
COPY . .

# Create a non-root user
RUN addgroup -S nodeapp && adduser -S -G nodeapp nodeapp

# Change ownership of the app directory
RUN chown -R nodeapp:nodeapp /usr/src/app

# Switch to non-root user
USER nodeapp

# Expose port
EXPOSE 3000

CMD ["node", "app.js"]