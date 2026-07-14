FROM node:22-alpine

RUN npm install -g create-awesome-node-app

ENTRYPOINT ["create-awesome-node-app"]
CMD ["--help"]
