# Build image
FROM node:16-alpine AS builder

WORKDIR /app

# Copy over dependency folders
COPY postinstall.js /app/
COPY package.json /app/
COPY yarn.lock /app/
COPY eslint/ /app/eslint/

# cache yarn 
ENV YARN_CACHE_FOLDER=/usr/local/yarn-cache
VOLUME /usr/local/yarn-cache

# Install dependencies
RUN yarn install

# Build for production
COPY . /app
ARG ENV
RUN yarn build

# Application image
FROM node:16-alpine

WORKDIR /app

# Copy over dependency folders for production
COPY postinstall.js /app/
COPY package.json /app/
COPY yarn.lock /app/
COPY eslint/ /app/eslint/

# cache yarn 
ENV YARN_CACHE_FOLDER=/usr/local/yarn-cache
VOLUME /usr/local/yarn-cache

# Install dependencies for production
ENV NODE_ENV=production
RUN yarn install

# Copy application build to image
COPY --from=builder /app/.next /app/.next
COPY public /app/public
COPY i18n /app/i18n
COPY next.config.js next-i18next.config.js /app/

EXPOSE 8080
ENTRYPOINT [ "yarn", "start" ]
