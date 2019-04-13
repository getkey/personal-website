FROM node:alpine as builder

WORKDIR /code

COPY package.json .
COPY yarn.lock .
RUN apk --no-cache add --virtual builds-deps build-base python
RUN yarn install

COPY src src


FROM node:alpine

WORKDIR /usr/src/personal-website

COPY --from=builder /code/package.json .
COPY --from=builder /code/src src
COPY --from=builder /code/node_modules node_modules

EXPOSE 8080
CMD ["node", "./src/index.js", "start", "8080"]
