#!/bin/sh

export PACKAGE_DIRS="$(dirname "$(pwd)")/"  && echo "set PACKAGE_DIRS to " $PACKAGE_DIRS && cd ./demo && meteor
