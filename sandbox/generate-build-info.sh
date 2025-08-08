#!/bin/bash

# This script outputs the build info to be used in deployments.

set -e

SCRIPT_PATH=$(dirname $0)
BUILD_INFO=$SCRIPT_PATH/../backend/build-info.json

print_usage () {
    cat <<EOF
Usage: $0 [-o <OUTPUT_FILE>]

-o, --output <OUTPUT_FILE>
    Output json file. Default: $BUILD_INFO
EOF
}

while [[ $# -gt 0 ]]; do
    case $1 in
        -o|--output)
            OUTPUT_FILE="$2"
            shift
            shift
            ;;
        -h|--help)
            print_usage
            exit 0
            ;;
        *)
            print_usage
            exit 1
    esac
done

OUTPUT="${OUTPUT_FILE:-$BUILD_INFO}"

echo "Generating $OUTPUT"
dirty_flag=`git diff --quiet || echo '-dirty'`
cat <<EOF > $OUTPUT
{
    "commit": "`git rev-parse HEAD`$dirty_flag",
    "timestamp": "`date "+%Y-%m-%d %H:%M:%S %:::z"`"
}
EOF
