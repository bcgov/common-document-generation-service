FROM docker.io/bcgovimages/alpine-node-libreoffice:20.9.0

ARG APP_ROOT=/opt/app-root/src
ENV APP_PORT=8080 \
    NO_UPDATE_NOTIFIER=true
WORKDIR ${APP_ROOT}

# Install Zip
RUN apk --no-cache add zip && \
    rm -rf /var/cache/apk/*

# Install BCSans Font
RUN wget https://www2.gov.bc.ca/assets/gov/british-columbians-our-governments/services-policies-for-government/policies-procedures-standards/web-content-development-guides/corporate-identity-assets/bcsansfont_print.zip?forcedownload=true -O bcsans.zip && \
    unzip bcsans.zip && \
    rm bcsans.zip && \
    mkdir -p /usr/share/fonts/bcsans && \
    install -m 644 ./BcSansFont_Print/*.ttf /usr/share/fonts/bcsans/ && \
    rm -rf ./BcSansFont_Print && \
    fc-cache -f

# NPM Permission Fix
RUN mkdir -p /.npm
RUN chown -R 1001:0 /.npm

# Install Application
COPY . .
RUN chown -R 1001:0 ${APP_ROOT}
USER 1001
RUN npm ci --omit=dev

EXPOSE ${APP_PORT}
CMD ["node", "./bin/www"]
