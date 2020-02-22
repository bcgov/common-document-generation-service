#!/usr/bin/env bash

# debug on fail
set -euo pipefail

# sensible defaults if not set
: "${DEDUPE:=true}"
: "${SLEEP_TIME:=60}"
: "${GRACEFUL_EXIT_TIME:=55}"
: "${HOSTNAME:=unknown}"
: "${STARTUP_TIME:=20}"

echo " DEDUPE ${DEDUPE}"
echo " POD_NAME ${POD_NAME}"
echo " CONTAINER_NAME ${CONTAINER_NAME}"
echo " LOG_SERVER_URI ${LOG_SERVER_URI}"
echo " SLEEP_TIME ${SLEEP_TIME}"
echo " GRACEFUL_EXIT_TIME ${GRACEFUL_EXIT_TIME}"
echo " HOSTNAME ${HOSTNAME}"
echo " STARTUP_TIME ${STARTUP_TIME}"

# sidecar does nothing if a header is empty
sleep infinity
