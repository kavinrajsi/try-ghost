# Use the official Ghost image (version 5, alpine = small and fast)
FROM ghost:5-alpine

# Set production environment
ENV NODE_ENV=production

# Ghost listens on port 2368 inside the container
EXPOSE 2368

# Optional: health check (Render uses this to see if Ghost is alive)
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD wget -qO- http://localhost:2368/ || exit 1
