FROM node:16-alpine as builder
WORKDIR /root/app

ADD . /root/app

RUN npm install && npm i -g next && npm run build

EXPOSE 3000
CMD [ "next", "start" ]