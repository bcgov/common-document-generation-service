FROM registry.access.redhat.com/rhel7-atomic
ARG APP_ROOT=/opt/app
RUN microdnf --enablerepo=rhel-7-server-ose-3.6-rpms --enablerepo=rhel-7-server-rpms install atomic-openshift-clients-3.6.173.0.21-1.git.0.f95b0e7.el7.x86_64 --nodocs; microdnf clean all; touch /tmp/healthy; touch /tmp/liveness;
WORKDIR ${APP_ROOT}
COPY sidecar-logging.sh ${APP_ROOT}
RUN chmod a+r ${APP_ROOT} && touch ${APP_ROOT}/liveness && touch ${APP_ROOT}/readiness && chmod a+rx ${APP_ROOT}/sidecar-logging.sh
CMD ["${APP_ROOT}/sidecar-logging.sh"]
