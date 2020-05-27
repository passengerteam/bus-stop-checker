SHELL := /bin/bash

.PHONY: build download-naptan build-graph extract import

USER:=$(shell id -u)
GROUP:=$(shell id -g)
PGHOST:="bsc_postgres"
PGDATABASE:="postgres"
PGUSER:="postgres"
PGPASSWORD:="postgres"

build:
	@docker-compose build
	@GROUP="$(GROUP)" USER="$(USER)" PGHOST="$(PGHOST)" PGDATABASE="$(PGDATABASE)" PGUSER="$(PGUSER)" PGPASSWORD="$(PGPASSWORD)" docker-compose run bsc_nodejs /bin/bash -c "npm install --production --no-cache && rm -rf /app/false"

download-naptan:
	@wget -O Naptan.zip http://naptan.app.dft.gov.uk/DataRequest/Naptan.ashx?format=csv
	@unzip Naptan.zip

build-graph:
	@GROUP="$(GROUP)" USER="$(USER)" PGHOST="$(PGHOST)" PGDATABASE="$(PGDATABASE)" PGUSER="$(PGUSER)" PGPASSWORD="$(PGPASSWORD)" docker-compose run bsc_osrm /app/build.sh

extract:
	@GROUP="$(GROUP)" USER="$(USER)" PGHOST="$(PGHOST)" PGDATABASE="$(PGDATABASE)" PGUSER="$(PGUSER)" PGPASSWORD="$(PGPASSWORD)" docker-compose run bsc_nodejs /app/extract.js

import:
	@GROUP="$(GROUP)" USER="$(USER)" PGHOST="$(PGHOST)" PGDATABASE="$(PGDATABASE)" PGUSER="$(PGUSER)" PGPASSWORD="$(PGPASSWORD)" docker-compose run -d bsc_postgres
	@sleep 15
	@GROUP="$(GROUP)" USER="$(USER)" PGHOST="$(PGHOST)" PGDATABASE="$(PGDATABASE)" PGUSER="$(PGUSER)" PGPASSWORD="$(PGPASSWORD)" docker-compose run bsc_nodejs /app/import.js
