FROM mhart/alpine-node:12

ENV PYTHONUNBUFFERED=1

WORKDIR /opt/app-root/src

# Install Python
RUN apk add --no-cache python3 \
 && if [ ! -e /usr/bin/python ]; then ln -sf python3 /usr/bin/python ; fi \
 && python3 -m ensurepip \
 && rm -r /usr/lib/python*/ensurepip \
 && pip3 install --no-cache --upgrade pip setuptools wheel \
 && if [ ! -e /usr/bin/pip ]; then ln -s pip3 /usr/bin/pip ; fi

# Install LibreOffice
RUN apk --no-cache add libreoffice

# Install CDOGS
COPY . .
RUN npm ci && npm run build
EXPOSE 3000
CMD ["npm", "run", "start"]
