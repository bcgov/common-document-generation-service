FROM registry.access.redhat.com/rhel7-atomic
RUN microdnf --enablerepo=rhel-7-server-ose-3.6-rpms --enablerepo=rhel-7-server-rpms install atomic-openshift-clients-3.6.173.0.21-1.git.0.f95b0e7.el7.x86_64 --nodocs; microdnf clean all
ADD ./sidecar-logging.sh /usr/local/bin
