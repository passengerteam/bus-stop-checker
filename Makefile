SHELL := /bin/bash
# Note: this needs tabs, not spaces
.PHONY:


NPROCS:=$(shell nproc)
UID:=$(shell id -u)
GID:=$(shell id -g)
REGION:="england"
AREA:="dorset"


.PHONY:

build:
	@docker-compose build --build-arg "CURRENT_UID=${UID}" --build-arg "CURRENT_GID=${GID}"

download-osm:
	@wget -O data/$(AREA)-latest.osm.pbf https://download.geofabrik.de/europe/great-britain/$(REGION)/$(AREA)-latest.osm.pbf

download-osm-gb:
	@wget -O data/great-britain-latest.osm.pbf https://download.geofabrik.de/europe/great-britain-latest.osm.pbf

download-osm-england:
	@wget -O data/england-latest.osm.pbf https://download.geofabrik.de/europe/great-britain/england-latest.osm.pbf

download-osm-scotland:
	@wget -O data/scotland-latest.osm.pbf https://download.geofabrik.de/europe/great-britain/scotland-latest.osm.pbf

download-osm-wales:
	@wget -O data/wales-latest.osm.pbf https://download.geofabrik.de/europe/great-britain/wales-latest.osm.pbf

download-naptan:
	@wget -O data/Naptan.zip 'http://naptan.app.dft.gov.uk/DataRequest/Naptan.ashx?format=csv'
	@unzip -d data data/Naptan.zip

download-naptan-authority:
	@wget -O data/Naptan.zip "http://naptan.app.dft.gov.uk/DataRequest/Naptan.ashx?format=csv&LA=$(AUTHORITY)"
	@unzip -d data data/Naptan.zip
	@unzip -d data "data/NaPTAN$(AUTHORITY)csv.zip"

graph:
	@echo "Building graph for: $(FILE)"
	@USER=$(UID) GROUP=$(GID) time docker-compose run osrm extract $(FILE)

import:
	@echo "Importing: $(FILE)"
	@time osmosis --read-pbf-fast workers=$(NPROCS) $(FILE) --buffer bufferCapacity=1000 --log-progress --write-pgsql database="${PGDATABASE}" host="${PGHOST}" user="${PGUSER}" password="${PGPASSWORD}"

shell:
	@USER=$(UID) GROUP=$(GID) docker-compose run busstopchecker

process:
	@yarn start process data/Stops.csv $(FILE)

tests:
	@yarn test

docker-clean:
	@echo -n "This will delete everything in docker, type 'deleteall' to confirm: "  && read ans && [ $$ans == "deleteall" ]
	@docker ps -aq | xargs -r docker stop
	@docker system prune -a -f
	@docker volume ls -q | xargs -r docker volume rm
	@docker network ls -q | xargs -r docker network rm
