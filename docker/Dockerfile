FROM node:10.7 as development

WORKDIR /usr/src/app

COPY . .

RUN yarn

EXPOSE 8091

CMD [ "yarn", "serve:dev" ]


FROM development as builder

RUN yarn && \
    yarn build:prod


FROM nginx:1.13.12-alpine as production
LABEL maintainer="Lucas Di Cunzolo <lucasdicunzolo@gmail.com>"
COPY --from=builder /usr/src/app/dist /usr/share/nginx/html
COPY docker/nginx/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]