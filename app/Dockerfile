FROM mhart/alpine-node:12

ARG APP_ROOT=/opt/app-root/src

ENV PATH="/usr/lib/libreoffice/program:${PATH}" \
    PYTHONUNBUFFERED=1

WORKDIR ${APP_ROOT}

# Install LibreOffice & Common Fonts
RUN apk --no-cache add bash libreoffice util-linux \
    ttf-droid-nonlatin ttf-droid ttf-dejavu ttf-freefont ttf-liberation \
 && rm -rf /var/cache/apk/*

# Fix Python/LibreOffice Integration
COPY docker ${APP_ROOT}/docker
RUN ${APP_ROOT}/docker/bindPython.sh

# Install CDOGS
COPY . .
RUN npm ci

EXPOSE 3000
CMD ["npm", "run", "start"]
