#!/bin/sh

# This script is used to build docker images after generation version info.

set -e -x

SCRIPT_DIR=$(realpath `dirname $0`)
CUR_DIR=$(pwd)
GEN_BUILD_INFO_SCRIPT=$SCRIPT_DIR/sandbox/generate-build-info.sh

if [ "$#" -ne 0 ]
then echo "Warning: use of $0 with dev/prod arguments deprecated."
     echo "This script only builds development-related images."
fi

$GEN_BUILD_INFO_SCRIPT

cd $SCRIPT_DIR
echo Building development docker images.
docker-compose build apache frontend backend neo4j-enterprise
cd $CUR_DIR

echo Images built successfully.
