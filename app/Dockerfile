FROM mhart/alpine-node:12
WORKDIR /opt/app-root/src
# Install LibreOffice
RUN apk --no-cache add libreoffice
# Install CDOGS
COPY . .
RUN npm ci && npm run build
EXPOSE 3000
CMD ["npm", "run", "start"]
