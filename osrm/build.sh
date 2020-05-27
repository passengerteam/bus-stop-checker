#!/bin/bash
set -e
cd /data

DATE=$(date +%s)
wget https://download.geofabrik.de/europe/great-britain-latest.osm.pbf
osrm-extract -p /opt/car.lua ./great-britain-latest.osm.pbf
osrm-partition ./great-britain-latest.osm.pbf
osrm-customize ./great-britain-latest.osrm

if [[ "$UPLOAD" == "true" ]]	; then
    tar -zcvf "great-britain-$DATE.tar.gz" ./great-britain*
    s3cmd --access_key=${AWS_ACCESS_KEY_ID} --secret_key=${AWS_SECRET_ACCESS_KEY} --region=eu-west-2 put "great-britain-$DATE.tar.gz" s3://naptanverifier-import/
fi
