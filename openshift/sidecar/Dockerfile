FROM registry.access.redhat.com/rhel7-atomic
ARG APP_ROOT=/opt/app
RUN microdnf --enablerepo=rhel-7-server-ose-3.11-rpms --enablerepo=rhel-7-server-rpms install atomic-openshift-clients --nodocs; microdnf clean all;
WORKDIR ${APP_ROOT}
COPY ./sidecar-logging.sh ${APP_ROOT}
RUN chmod a+r ${APP_ROOT} && touch ${APP_ROOT}/liveness && touch ${APP_ROOT}/readiness && chmod a+rx ${APP_ROOT}/sidecar-logging.sh
CMD ["${APP_ROOT}/sidecar-logging.sh"]
