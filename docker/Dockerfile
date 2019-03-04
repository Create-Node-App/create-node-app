FROM node:10.7

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

COPY . .

RUN yarn

EXPOSE 8091

CMD [ "yarn", "serve:dev" ]
