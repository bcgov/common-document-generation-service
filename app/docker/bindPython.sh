#!/bin/bash
# find where python was installed
encodings_root=$(find /usr/lib/python* -type d -name 'encodings')
python_root=$(dirname $encodings_root)

mv ${APP_ROOT}/docker/python /usr/lib/libreoffice/program
ln -sf /usr/bin/python3 /usr/lib/libreoffice/program/python.bin
ln -sf ${python_root} /usr/lib/libreoffice/program/python-core
chmod a+rx /usr/lib/libreoffice/program/python

exit 0
