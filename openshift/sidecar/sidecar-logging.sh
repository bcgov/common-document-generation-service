#!/usr/bin/env bash

# debug on fail
set -euo pipefail

if [ "x${DEBUG}" = xtrue ]; then
  set -x
fi

# required
: "${DEDUPE:?You must set deduplication}"
: "${POD_NAME:?Pod name should be set from downward api}"
: "${CONTAINER_NAME:?You must set container name}"
: "${LOG_SERVER_URI:?You must set logging server endpoint}"

# sensible defaults if not set
: "${DEDUPE:=true}"
: "${SLEEP_TIME:=60}"
: "${GRACEFUL_EXIT_TIME:=55}"
: "${HOSTNAME:=unknown}"
: "${STARTUP_TIME:=20}"

echo "Caught DEDUPE ${DEDUPE}"
echo "Caught POD_NAME ${POD_NAME}"
echo "Caught CONTAINER_NAME ${CONTAINER_NAME}"
echo "Caught LOG_SERVER_URI ${LOG_SERVER_URI}"
echo "Caught SLEEP_TIME ${SLEEP_TIME}"
echo "Caught GRACEFUL_EXIT_TIME ${GRACEFUL_EXIT_TIME}"
echo "Caught HOSTNAME ${HOSTNAME}"
echo "Caught STARTUP_TIME ${STARTUP_TIME}"

# sidecar does nothing if a header is empty
sleep infinity
