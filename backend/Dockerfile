# backend/Dockerfile
FROM node:20-alpine as localization-builder

# Build localization package
WORKDIR /localization
COPY localization/package*.json ./
RUN npm ci --only=production
COPY localization/ ./
RUN npm pack

# Backend build stage
FROM node:20-alpine

WORKDIR /usr/src/app

# Copy and install localization package first
COPY --from=localization-builder /localization/*.tgz ./
RUN npm install *.tgz && rm *.tgz

# Install backend dependencies
COPY backend/package*.json ./
RUN npm ci --omit=dev

# Copy backend source
COPY backend/ ./

# Create a non-root user
RUN addgroup -S nodeapp && adduser -S -G nodeapp nodeapp

# Change ownership of the app directory
RUN chown -R nodeapp:nodeapp /usr/src/app

# Switch to non-root user
USER nodeapp

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('./app.js')" || exit 1

CMD ["node", "app.js"]