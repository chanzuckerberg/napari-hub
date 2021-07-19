# Build image
FROM node:16-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package.json yarn.lock postinstall.js /app/
RUN yarn install

# Build for production
COPY . /app
ARG ENV
RUN yarn build

# Application image
FROM node:16-alpine

WORKDIR /app

# Install supervisord for process management and ngninx for the web server.
RUN apk update && apk add --no-cache supervisor nginx && mkdir /run/nginx

# Install dependencies for production
COPY package.json yarn.lock postinstall.js /app/
ENV NODE_ENV=production
RUN yarn install

# Copy application build to image
COPY --from=builder /app/.next /app/.next
COPY public /app/public
COPY supervisord.conf /etc/supervisord.conf
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 8080
ENTRYPOINT [ "/usr/bin/supervisord", "-c", "/etc/supervisord.conf" ]
