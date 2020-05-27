# Bus Stop Checker
------------------

A project to visualise confidence in NaPTAN open data for national public transport.

This repository contains the project that processes [OpenStreetMap](https://www.openstreetmap.org) + [NaPTAN](https://data.gov.uk/dataset/ff93ffc1-6656-47d8-9155-85ea0b8f2251/national-public-transport-access-nodes-naptan) data, it does not contain an API or UI.

This is roughly how the tool works:

1.  Find nearest [OpenStreetMap (OSM)](https://www.openstreetmap.org/) road using [OSRM](http://project-osrm.org/).
2.  Calculate road bearing.
3.  Find position of the stop with respect to the road.
4.  Check if stop bearing is similar to road bearing.  

## Usage

### Overview

The full pipeline can take an hour to process, this is heavily dependant on the hardware used - the amount of processing threads and memory available, the size of the geographical area/NaPTAN dataset processed, as well as your internet connection.

This project has only been tested on Linux ([Fedora](https://getfedora.org/)/[Ubuntu](https://ubuntu.com/)). Windows and MacOS have not been tested.

This project is designed to run within [Docker](https://www.docker.com) containers, as it requires a specific configuration/set of installed packages to function.

### Commands

The Makefile defines a set of simple commands to run the pipeline. To use the default settings, copy `.env.dist` to `.env`.

1.  Run `make build` to build the docker containers.

2.  Run `make download-osm-gb` to download the OpenStreetMap data for the whole of Great Britain.

    Or, you can download OSM data for a specific region using `make download-osm-england`, `make download-osm-wales` and `make download-osm-scotland`.

    Or, you can download OSM data for a specific area using `make download-osm REGION=england AREA=dorset`.

    You can find the area code for each region here: [England](https://download.geofabrik.de/europe/great-britain/england.html) / [Wales](https://download.geofabrik.de/europe/great-britain/wales.html) / [Scotland](https://download.geofabrik.de/europe/great-britain/scotland.html)

    These commands will download an osm file into the `data` directory.

3.  Run `make download-naptan` to download the latest snapshot of NaPTAN.

    Or, you can download NaPTAN for a specific local authority, e.g. `make download-naptan-authority AUTHORITY="120"`, this is filtered by the LA's ATCO prefix.

    See [here](http://naptan.app.dft.gov.uk/Reports/frmStopsSummaryReport) for a list of authority ATCO prefixes.

4.  Run `make graph FILE=data/dorset-latest.osm.pbf` to build the OSRM graph, change the `FILE` argument to the path of the OSM data previously downloaded.

5.  Get a shell in the container with `make shell`

6.  To install the dependencies, type `yarn install`.

7.  Import a PBF file to the database with `make import FILE=data/dorset-latest.osm.pbf`, change the `FILE` argument to the path of the OSM data previously downloaded.

8.  Run `make process FILE=data/dorset-latest.osm.pbf`, change the `FILE` argument to the path of the OSM data previously downloaded. This will process the database, and output results to `output.csv`.

### Cleanup

To re-import new/different OSM data, you must clear the PostgreSQL database.
You can do this by finding the PostgreSQL docker volume `docker volume ls`, and removing it with `docker volume rm $VOLUME`. You may also need to remove any attached/running containers with `docker rm`.

## Development

This project is written in Javascript, we recommend using the docker containers otherwise you'll have to compile OSRM bindings on your host.

We use Babel to compile the source code into code runnable by NodeJS v10.

You can run the test suite with `make tests`, this requires the pipeline to have previously been ran for Great Britain.

### Contributing

This project is open sourced for informational purposes only, and is not currently under active development.

No support will be provided in the usage or modification of this project.

Pulls requests and issues are welcome (for feature/v2), but will be addressed sporadically.

### Known issues

Possible mismatch of selected OSM nodes because of <https://github.com/Project-OSRM/osrm-backend/issues/5415>, could work around this with the PostgreSQL database, or entirely replace OSRM with PostgreSQL for snapping to the road network.

### Todo

-   Continued re-factoring / clean-up

## Licence

Copyright 2020 Passenger Technology Group Ltd

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

<http://www.apache.org/licenses/LICENSE-2.0>

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express
or implied. See the License for the specific language governing
permissions and limitations under the License.
