FROM docker.io/bcgovimages/alpine-node-libreoffice:1.0.4

ARG APP_ROOT=/opt/app-root/src
ENV NO_UPDATE_NOTIFIER=true \
    APP_PORT=3000
WORKDIR ${APP_ROOT}

COPY . .
RUN npm ci

EXPOSE ${APP_PORT}
CMD ["npm", "run", "start"]
