FROM node:15
COPY . /app
WORKDIR /app
RUN yarn install && yarn build
EXPOSE 8080
ENTRYPOINT [ "yarn", "start" ]
