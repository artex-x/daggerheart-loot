#!/bin/sh
# The repository is mounted read-only at /work. Copy it to /app so the run can
# build dist/ and write test-output/ without touching the host tree, and borrow
# the image's linux node_modules.
set -e
cp -a /work/. /app/
rm -rf /app/node_modules
ln -s /deps/node_modules /app/node_modules
exec "$@"
