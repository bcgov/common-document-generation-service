FROM registry.access.redhat.com/rhel7-atomic
ARG APP_ROOT=/opt/app
RUN microdnf --enablerepo=rhel-7-server-ose-3.11-rpms --enablerepo=rhel-7-server-rpms install atomic-openshift-clients-3.11.170-1.git.0.00cac56.el7.x86_64 --nodocs; microdnf clean all;
RUN mkdir -p ${APP_ROOT} && touch ${APP_ROOT}/liveness && chmod a+r ${APP_ROOT}/liveness && touch ${APP_ROOT}/readiness && chmod a+r ${APP_ROOT}/readiness
COPY ./sidecar-logging.sh ${APP_ROOT}
RUN chmod a+rx ${APP_ROOT}/sidecar-logging.sh
CMD ["${APP_ROOT}/sidecar-logging.sh"]
