FROM node:16
LABEL author="Unai Perez <unai.perez@ikerlan.es>"
WORKDIR /root/app

ADD . /root/app

RUN npm install && npm run build
CMD [ "npm", "run", "start" ]
