# syntax=docker/dockerfile:1.9
FROM node:22-alpine

# VERSION is passed at build time by the publish workflow so the image
# is pinned to a specific npm package version (satisfies hadolint DL3016
# and makes each image reproducible for its tag).
ARG VERSION=latest

# hadolint ignore=DL3018
RUN npm install -g "create-awesome-node-app@${VERSION}"

ENTRYPOINT ["create-awesome-node-app"]
CMD ["--help"]
