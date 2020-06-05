FROM node:12.14-alpine as development
WORKDIR /usr/src/app
COPY . .
RUN yarn
EXPOSE 8091
CMD [ "yarn", "serve:dev" ]


FROM development as builder
WORKDIR /usr/src/app
COPY . .
ARG API_BASE_URL
ENV API_BASE_URL=$API_BASE_URL
RUN yarn && yarn build:prod


FROM nginx:1.13.12-alpine as production
COPY --from=builder /usr/src/app/dist /usr/share/nginx/html
COPY docker/nginx/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
