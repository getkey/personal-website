FROM node:alpine

RUN mkdir -p /usr/src/personal-website
WORKDIR /usr/src/personal-website

COPY package.json /usr/src/personal-website
RUN apk --no-cache add --virtual builds-deps build-base python && npm install && apk del builds-deps

COPY . /usr/src/personal-website

EXPOSE 8080
CMD ["node", "index.js", "start", "8080"]
