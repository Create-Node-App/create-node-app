# syntax=docker/dockerfile:1.9
FROM node:22-alpine

# VERSION is passed at build time by the publish workflow so the image
# is pinned to a specific npm package version (satisfies hadolint DL3016
# and makes each image reproducible for its tag).
ARG VERSION=latest

# hadolint ignore=DL3018
RUN npm install -g "create-awesome-node-app@${VERSION}"

# node:22-alpine ships an unprivileged `node` user by default. Run as
# that user so the scaffolded project files (mounted in via -v $PWD:/app)
# don't end up owned by root on the host.
USER node
WORKDIR /home/node

ENTRYPOINT ["create-awesome-node-app"]
CMD ["--help"]
