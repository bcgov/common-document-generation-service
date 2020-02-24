FROM frolvlad/alpine-glibc:latest

ARG OC_VERSION=3.11.173
ARG BUILD_DEPS='tar gzip'
ARG RUN_DEPS='bash curl ca-certificates gettext'

ARG APP_ROOT=/opt/app

RUN apk update && apk upgrade && apk --no-cache add $BUILD_DEPS $RUN_DEPS && \
    curl -sLo /tmp/oc.tar.gz https://mirror.openshift.com/pub/openshift-v$(echo $OC_VERSION | cut -d'.' -f 1)/clients/$OC_VERSION/linux/oc.tar.gz && \
    tar xzvf /tmp/oc.tar.gz -C /usr/local/bin/ && \
    rm -rf /tmp/oc.tar.gz

RUN mkdir -p ${APP_ROOT} && touch ${APP_ROOT}/liveness && chmod a+r ${APP_ROOT}/liveness && touch ${APP_ROOT}/readiness && chmod a+r ${APP_ROOT}/readiness
COPY ./sidecar-logging.sh ${APP_ROOT}
RUN chmod a+rx ${APP_ROOT}/sidecar-logging.sh

ENTRYPOINT ["/opt/app/sidecar-logging.sh"]
