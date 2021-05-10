# Build image
FROM node:16-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package.json yarn.lock postinstall.js /app/
RUN yarn install

# Build for production
COPY . /app
RUN yarn build

# Application image
FROM node:16-alpine

WORKDIR /app

# Install dependencies for production
COPY package.json yarn.lock postinstall.js /app/
ENV NODE_ENV=production
RUN yarn install

# Copy application build to image
COPY --from=builder /app/.next /app/.next

EXPOSE 8080
ENTRYPOINT [ "yarn", "start" ]
