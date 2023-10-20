FROM docker.io/bcgovimages/alpine-node-libreoffice:18.18.2

ARG APP_ROOT=/opt/app-root/src
ENV APP_PORT=8080 \
    NO_UPDATE_NOTIFIER=true
WORKDIR ${APP_ROOT}

# NPM Permission Fix (already present in base image)

# Install Application
COPY . .
RUN chown -R 1001:0 ${APP_ROOT}
USER 1001
RUN npm ci --omit=dev

EXPOSE ${APP_PORT}
CMD ["npm", "run", "start"]
