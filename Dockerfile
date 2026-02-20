# Stage 1: The Base Environment (Using lightweight Alpine Linux)
FROM node:20-alpine AS base

# Stage 2: The Builder (Where we assemble the code)
FROM base AS builder
WORKDIR /app

# Copy the instructions for packages
COPY package.json package-lock.json* ./
# Install all packages safely
RUN npm ci

# Copy all your website code
COPY . .
# Build the highly-optimized production website
RUN npm run build

# Stage 3: The Runner (The final Glass Box we actually ship to your mom's customers)
FROM base AS runner
WORKDIR /app

# Tell the app it is officially in production mode
ENV NODE_ENV production

# Only copy the essential public files and the optimized standalone build
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Open a window in the glass box so traffic can come in on port 3000
EXPOSE 3000
ENV PORT 3000

# The command that turns the engine on!
CMD ["node", "server.js"]