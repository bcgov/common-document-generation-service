FROM docker.io/node:20.19.0-alpine

ARG APP_ROOT=/opt/app-root/src
ENV NO_UPDATE_NOTIFIER=true \
  PATH="/usr/lib/libreoffice/program:${PATH}" \
  PYTHONUNBUFFERED=1
WORKDIR ${APP_ROOT}

# Install LibreOffice & Common Fonts
RUN apk --no-cache add bash libreoffice util-linux \
  font-droid-nonlatin font-droid ttf-dejavu ttf-freefont ttf-liberation && \
  rm -rf /var/cache/apk/*

# Install Microsoft Core Fonts
RUN apk --no-cache add msttcorefonts-installer fontconfig && \
  update-ms-fonts && \
  fc-cache -f && \
  rm -rf /var/cache/apk/*

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

# enable PDF/UA compliance in LibreOffice registry
RUN sed -i \
  's|<prop oor:name="PDFUACompliance" oor:type="xs:boolean" oor:nillable="false"><value>false</value></prop>|<prop oor:name="PDFUACompliance" oor:type="xs:boolean" oor:nillable="false"><value>true</value></prop>|' \
  /usr/lib/libreoffice/share/registry/main.xcd

# NPM Permission Fix
RUN mkdir -p /.npm
RUN chown -R 1001:0 /.npm

# Install Application
COPY .git ${APP_ROOT}/.git
COPY app ${APP_ROOT}
RUN chown -R 1001:0 ${APP_ROOT}
USER 1001
RUN npm ci --omit=dev

EXPOSE ${APP_PORT}
CMD ["node", "./bin/www"]
