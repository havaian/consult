# backend/Dockerfile
FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY backend/package*.json ./
RUN npm ci --omit=dev

# Copy source
COPY backend/ .

# Copy localization locales
COPY localization/locales ./src/localization/locales

# Create a non-root user
RUN addgroup -S nodeapp && adduser -S -G nodeapp nodeapp

# Change ownership of the app directory
RUN chown -R nodeapp:nodeapp /app

# Switch to non-root user
USER nodeapp

# Expose port
EXPOSE 3000

CMD ["node", "app.js"]