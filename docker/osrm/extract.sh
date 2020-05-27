#!/bin/sh
set -e
FILE=$1
FILENAME="${FILE%.*}"
FILENAME="${FILENAME%.*}"

osrm-extract -p /opt/car.lua "/$FILE"
osrm-partition "/$FILE"
osrm-customize "/$FILENAME.osrm"
