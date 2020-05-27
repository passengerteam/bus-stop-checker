# Bus Stop Checker
------------------

A project to visualise confidence in NaPTAN open data for national public transport.

This repository contains the project that processes [OpenStreetMap](https://www.openstreetmap.org) + [NaPTAN](https://data.gov.uk/dataset/ff93ffc1-6656-47d8-9155-85ea0b8f2251/national-public-transport-access-nodes-naptan) data, it does not contain an API or UI.

This is roughly how the tool works:

1.  Find nearest [OpenStreetMap (OSM)](https://www.openstreetmap.org/) road using [OSRM](http://project-osrm.org/).
2.  Calculate road bearing.
3.  Find position of the stop with respect to the road.
4.  Check if stop bearing is similar to road bearing.   

## Rewrite

**There is an in-progress re-write of this project, see branch [feature/v2](https://github.com/passengerteam/bus-stop-checker/tree/feature/v2)**

V2 contains many bugfixes and improvements, and a general refactor, we'd recommend using feature/v2 where possible

Master branch is currently used for generating the production data for <https://www.busstopchecker.com>

## Usage

### Overview

The full pipeline can take an hour to process, this is heavily dependant on the hardware used - the amount of processing threads and memory available, the size of the geographical area/NaPTAN dataset processed, as well as your internet connection.

This project has only been tested on Linux ([Fedora](https://getfedora.org/)/[Ubuntu](https://ubuntu.com/)). Windows and MacOS have not been tested.

This project is designed to run within [Docker](https://www.docker.com) containers, as it requires a specific configuration/set of installed packages to function.

### Commands

1.  Run `make build` to build the containers
2.  Run `make build-graph` to download the latest OSM data for Great Britain and build an OSRM graph.
3.  Run `make download-naptan` to download NaPTAN.
4.  Run `make extract` to extract OSM nodes into a LevelDB database.
5.  Run `make import` to process and import stops into postgres.

### Accessing Results

All results are stored in PostgreSQL, you can see the default credentials in the `Makefile`.

By default, PostgreSQL is started on 127.0.0.1:5432.

A [Protocol Buffers](https://developers.google.com/protocol-buffers) file is also created (`verifications.pbf`), which can be read using `verifications.proto`.

## Development

This project is written in Javascript runnable by Node v10, we recommend using the docker containers otherwise you'll have to compile OSRM bindings on your host.

### Contributing

This project is open sourced for informational purposes only, and is not currently under active development.

No support will be provided in the usage or modification of this project.

Pulls requests and issues are welcome (for feature/v2), but will be addressed sporadically.

### Known issues

Possible mismatch of selected OSM nodes because of <https://github.com/Project-OSRM/osrm-backend/issues/5415>, could work around this with the PostgreSQL database, or entirely replace OSRM with PostgreSQL for snapping to the road network.

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
