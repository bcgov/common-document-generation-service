FROM node:10

WORKDIR /tmp
RUN wget http://downloadarchive.documentfoundation.org/libreoffice/old/6.3.3.1/deb/x86_64/LibreOffice_6.3.3.1_Linux_x86-64_deb.tar.gz -O libo.tar.gz
RUN apt update \
 && apt install -y libxinerama1 libfontconfig1 libdbus-glib-1-2 libcairo2 libcups2 libglu1-mesa libsm6 unzip \
 && tar -zxvf libo.tar.gz \
 && cd LibreOffice_6.3.3.1_Linux_x86-64_deb/DEBS
RUN dpkg -i *.deb

# Install CDOGS
WORKDIR /opt/app-root/src
COPY . .
RUN npm ci
EXPOSE 3000
CMD ["npm", "run", "start"]


# FROM node:lts-stretch

# ARG LO_VERSION=6.3.4.2

# # Install Dependencies
# RUN apt update \
#  && apt install -y libxinerama1 libfontconfig1 libdbus-glib-1-2 libcairo2 libcups2 libglu1-mesa libsm6 unzip

# # Install LibreOffice
# WORKDIR /tmp
# RUN wget https://downloadarchive.documentfoundation.org/libreoffice/old/${LO_VERSION}/src/libreoffice-${LO_VERSION}.tar.xz -O libo.tar.gz \
#  && tar -zxvf libo.tar.gz
# RUN cd LibreOffice_${LO_VERSION}_Linux_x86-64_deb/DEBS \
#  && dpkg -i *.deb \
#  && cd /tmp \
#  && rm libo.tar.gz \
#  && rm -rf LibreOffice_${LO_VERSION}_Linux_x86-64_deb/DEBS

# # Install CDOGS
# WORKDIR /opt/app-root/src
# COPY . .
# RUN npm ci
# EXPOSE 3000
# CMD ["npm", "run", "start"]

# FROM mhart/alpine-node:12

# ENV PYTHONUNBUFFERED=1

# WORKDIR /opt/app-root/src

# # Install LibreOffice
# RUN apk --no-cache add libreoffice

# # Install Python
# RUN apk add --no-cache python3 \
#  && if [ ! -e /usr/bin/python ]; then ln -sf python3 /usr/bin/python ; fi \
#  && python3 -m ensurepip \
#  && rm -r /usr/lib/python*/ensurepip \
#  && pip install --no-cache --upgrade pip setuptools wheel \
#  && if [ ! -e /usr/bin/pip ]; then ln -s pip3 /usr/bin/pip ; fi

# # Install CDOGS
# COPY . .
# RUN npm ci
# EXPOSE 3000
# CMD ["npm", "run", "start"]
