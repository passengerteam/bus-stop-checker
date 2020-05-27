'use strict';

import {
    sanitizedRoadWords,
    inclusionList,
    nameTags
} from './Constants.js';
import * as geometry from './Geometry.js';
import * as levenshtein from 'fast-levenshtein';
import * as math from 'mathjs';
let hstore = require('pg-hstore')();

import StopFactory from './StopFactory.js';

const {
    Client
} = require('pg').native;

import OSRM from 'osrm';

class Verifier {
    constructor(graphFile) {
        this.pgClient = new Client({
            user: 'bsc',
            host: 'bsc_postgres',
            database: 'bsc',
            password: 'bsc',
        });

        this.osrm = new OSRM({
            path: process.cwd() + graphFile,
            algorithm: 'MLD'
        });

        this.stopFactory = new StopFactory();
    }

    async destruct() {
        await this.pgClient.end();
        this.pgClient = null;
        this.osrm = null;
    }

    async init() {
        await this.pgClient.connect();
        console.log('Connected to reader database.');
    }

    async verify(stop, rawStop) {
        if (rawStop) {
            stop = this.stopFactory.fromArray(stop);
        }

        // If this isn't a BCT, or it's deleted, just return false
        if (stop.getType() !== 'BCT' || stop.getStatus() === 'del') {
            return false;
        }

        let skipBearingConfidence = false;

        // If we don't even have a street, score it low
        if (false === stop.hasStreet()) {
            stop.setConfidenceIsCorrect(20);
            skipBearingConfidence = true;
        }

        // If this isn't a flexible stop
        if (stop.getSubType() !== 'FLX') {
            // If we don't even have a bearing, mark it low
            if (false === stop.hasBearing()) {
                stop.setConfidenceIsCorrect(20);
                skipBearingConfidence = true;
            }
        }

        // Get the osm data for this stop
        let osmData = await this.getOsmData(stop);
        let nodeALocation = null;
        let nodeBLocation = null;

        // If we managed to get osm data
        if (osmData && osmData.osmNodes && osmData.osmNodes.nodes && osmData.osmNodes.nodes.length && osmData.matchlocations.length) {
            nodeALocation = osmData.matchlocations[0];
            nodeBLocation = osmData.matchlocations[1];

            // And managed to get both node locations
            if (nodeALocation && nodeBLocation) {
                // Get the bearing between the nodes
                let roadBearing = this.getRoadBearing(nodeALocation, nodeBLocation, stop);

                // If we managed to calculate the bearing
                if (roadBearing.bearing) {
                    // Store the actual bearing
                    stop.setOsmBearing(roadBearing.compass);

                    // If we have a bearing in NaPTAN, calculate the difference
                    if (true === stop.hasBearing()) {
                        // Store the difference between NaPTAN and OSM
                        let difference = geometry.differenceBetweenBearings(geometry.bearingToDegress[stop.getBearing()], roadBearing.bearing);
                        let absDiff = math.abs(difference);
                        stop.setBearingDifference(absDiff);

                        // If we've not decided to skip scoring for this stop, score it based on the bearing difference
                        if (!skipBearingConfidence) {
                            if (stop.getBearingDifference() > 90) {
                                stop.setConfidenceIsCorrect(25);
                            } else if (stop.getBearingDifference() > 75) {
                                stop.setConfidenceIsCorrect(30);
                            } else if (stop.getBearingDifference() > 60) {
                                stop.setConfidenceIsCorrect(35);
                            } else if (stop.getBearingDifference() > 45) {
                                stop.setConfidenceIsCorrect(45);
                            } else {
                                stop.setConfidenceIsCorrect(80);
                            }
                        }
                    }
                }
            }
        }

        return this.buildResponse(stop, osmData, nodeALocation, nodeBLocation);
    }

    buildResponse(stop, osmData, nodeALocation, nodeBLocation) {
        let osmNodeALat = null;
        let osmNodeALon = null;
        let osmNodeAId = null;

        let osmNodeBLat = null;
        let osmNodeBLon = null;
        let osmNodeBId = null;

        if (osmData && osmData.osmNodes && osmData.osmNodes.nodes && nodeALocation && nodeBLocation) {
            osmNodeALat = nodeALocation[0];
            osmNodeALon = nodeALocation[1];
            osmNodeAId = osmData.osmNodes.nodes[0];

            osmNodeBLat = nodeBLocation[0];
            osmNodeBLon = nodeBLocation[1];
            osmNodeBId = osmData.osmNodes.nodes[1];
        }

        let response = [
            stop.getAtco(),
            stop.getLatitude(),
            stop.getLongitude(),
            stop.getBearing(),
            stop.getStreet(),
            (osmData && osmData.osmStreet) ? osmData.osmStreet : null,
            stop.getConfidenceIsCorrect(),
            stop.getOsmBearing(),
            stop.getBearingDifference(),
            (osmData && osmData.distanceFromRoad) ? osmData.distanceFromRoad : null,
            stop.getAdministrativeAreaCode(),
            stop.getName(),
            stop.getNptgLocalityCode(),
            osmNodeALat,
            osmNodeALon,
            osmNodeAId,
            osmNodeBLat,
            osmNodeBLon,
            osmNodeBId,
        ];

        return response;
    }

    getRoadBearing(nodeAlocation, nodeBLocation, stop) {
        let roadBearing = geometry.getRoadBearing(nodeAlocation, nodeBLocation, stop);
        let roadBearingCompass = geometry.degreesToCompass(roadBearing);

        return {
            bearing: roadBearing,
            compass: roadBearingCompass
        };
    }

    getOsmData(stop, radius, iter) {
        let self = this;
        return new Promise(resolve => {
            if (typeof radius === 'undefined') {
                radius = 10;
            }

            if (typeof iter === 'undefined') {
                iter = 0;
            }
            if (false === stop.hasStreet() || false === stop.hasCoordinates()) {
                resolve(false);
                return;
            }

            this.osrm.nearest({
                coordinates: [
                    [stop.getLongitude(), stop.getLatitude()]
                ],
                radiuses: [radius],
                number: 2147483647,
                snapping: 'any',
            }, async function(err, result) {
                if (!err && Object.prototype.hasOwnProperty.call(result, 'waypoints')) {
                    let data = await self.findOsmNodes(result.waypoints, stop);
                    resolve(data);
                } else {
                    iter++;
                    if (iter <= 10) {
                        resolve(self.getOsmData(stop, 10 * iter, iter));
                    } else {
                        resolve(false);
                    }
                }
            });
        });
    }

    async getOsmNodeLocation(node) {
        const res = await this.pgClient.query('SELECT ST_AsGeoJSON(geom) as geom FROM nodes where id = $1', [node]);
        if (!res || !res.rows || !res.rows.length) {
            return false;
        }

        let geom = JSON.parse(res.rows[0].geom);

        return [geom.coordinates[1], geom.coordinates[0]];
    }

    async findOsmNodes(waypoints, stop) {
        let sanitizedStopStreet = this.normalizeRoadName(stop.getStreet());

        let osmNodes = {
            nodes: [],
            location: []
        };
        let osmStreet = null;
        let matches = [];
        let matchlocations = [];
        let distanceFromRoad = null;

        for (let index = 0; index < waypoints.length; index++) {
            let waypoint = waypoints[index];

            // If this has invalid nodes, or the waypoint is between the same node, skip
            // See: https://github.com/Project-OSRM/osrm-backend/issues/5415 2590B1210
            if (waypoint['nodes'][0] == 0 || waypoint['nodes'][1] == 0 || waypoint['nodes'][0] == waypoint['nodes'][1]) {
                continue;
            }

            // Resolve all node locations
            let locations = [];
            await Promise.all(waypoint['nodes'].map(async (node, index) => {
                let location = await this.getOsmNodeLocation(node);
                locations[index] = location;
            }));

            // Build a list of waypoint names
            let wayNames = [];
            if (waypoint['name'].length) {
                wayNames.push(waypoint['name']);
            }

            let ways = await this.getWaysFromNodes(waypoint['nodes']);
            if (ways && ways.length) {
                for (let way of ways) {
                    let wayName = this.getRoadName(way);
                    if (wayName && !wayName.includes(wayName)) {
                        wayNames.push(wayName);
                    }
                }
            }

            // If we don't have a way name, we can't confirm the match
            if (!wayNames.length) {
                continue;
            }

            // Compare all the waypoint names to the stop street
            let comparisons = [];
            for (let wayName of wayNames) {
                let comparison = this.compareRoadNames(wayName, sanitizedStopStreet);
                if (!comparison) {
                    continue;
                }

                comparisons.push(comparison);
            }

            // Determine the best comparison
            let bestComparison = null;
            for (let comparison of comparisons) {
                if (bestComparison == null) {
                    bestComparison = comparison;
                    continue;
                }

                if (comparison[0] && comparison[1] < bestComparison[1]) {
                    bestComparison = comparison;
                }
            }

            let levenshteinDistance = null;
            let wayName = null;

            if (bestComparison) {
                levenshteinDistance = bestComparison[1];
                wayName = bestComparison[2];
            }

            // Get the location of each node from the database
            let minDistance = geometry.pointDistanceFromLine(stop.getLatitude(), stop.getLongitude(), locations[0][0], locations[0][1], locations[1][0], locations[1][1]);
            matches.push([index, levenshteinDistance, waypoint.distance, minDistance, locations, wayName]);
        }

        // Sort the waypoint matches
        matches.sort(function(match1, match2) {
            // Sort by levenshteinDistance
            if (match1[1] > match2[1]) return 1;
            if (match1[1] < match2[1]) return -1;

            // Sort by mininum distance
            if (match1[3] > match2[3]) return 1;
            if (match1[3] < match2[3]) return -1;

            // Sort by waypoint distance
            if (match1[2] > match2[2]) return 1;
            if (match1[2] < match2[2]) return -1;
        });

        // If we got any matches
        if (matches.length !== 0) {
            // Use the best match
            let waypoint = waypoints[matches[0][0]];

            osmNodes = {
                nodes: waypoint['nodes'],
                location: waypoint['location']
            };
            osmStreet = matches[0][5];
            distanceFromRoad = matches[0][3];
            matchlocations = matches[0][4];
        }

        return {
            osmNodes: osmNodes,
            osmStreet: osmStreet,
            distanceFromRoad: distanceFromRoad,
            matchlocations: matchlocations
        };
    }


    async getWaysFromNodes(nodes) {
        let res = null;
        try {
            res = await this.pgClient.query('select w.* from way_nodes wn left join ways w on (wn.way_id = w.id) where wn.node_id = $1 and w.nodes @> \'{' + nodes.join(',') + '}\';', [nodes[0]]);
        } catch (e) {
            console.log(e);
            process.exit(0);
        }

        if (!res || !res.rows || !res.rows.length) {
            return false;
        }

        for (let index = 0; index < res.rows.length; index++) {
            if (Object.prototype.hasOwnProperty.call(res.rows[index], 'tags')) {
                res.rows[index].tags = hstore.parse(res.rows[index].tags);
            }
        }

        return res.rows;
    }

    getRoadName(way) {
        // We can't return a name if this way has no tags
        if (!Object.prototype.hasOwnProperty.call(way, 'tags')) {
            return null;
        }

        // Determine if this way should be included
        let include = false;
        for (let tag of inclusionList) {
            if (Object.prototype.hasOwnProperty.call(way.tags, tag)) {
                include = true;
                break;
            }
        }

        if (!include) {
            return null;
        }

        // Return the best name tag
        for (let nameTag of nameTags) {
            if (Object.prototype.hasOwnProperty.call(way.tags, nameTag)) {
                return way.tags[nameTag];
            }
        }

        return null;
    }

    normalizeRoadName(road) {
        road = road.toLowerCase().replace(/[.,'/#!$%^&*;:{}=-_`~()]/g, '');

        let words = road.split(' ');
        for (let index = 0; index < words.length; index++) {
            let word = words[index];
            if (Object.prototype.hasOwnProperty.call(sanitizedRoadWords, word)) {
                words[index] = sanitizedRoadWords[word];
            }
        }

        return words.join('').replace(/ /g, '');
    }

    compareRoadNames(wayName, sanitizedStopStreet) {
        let sanitizedWaypointName = this.normalizeRoadName(wayName);
        if (!sanitizedWaypointName.length) {
            return null;
        }

        // Determine if this is a numbered road, e.g. A1234, M1
        let numberedRoad = false;
        let numbers = 0;
        let letters = 0;
        for (let charIndex = 0; charIndex < sanitizedStopStreet.length; charIndex++) {
            if (isNaN(sanitizedStopStreet.charAt(charIndex))) {
                letters++;
            } else {
                numbers++;
            }
        }

        if (numbers > letters || numbers === letters) {
            numberedRoad = true;
        }

        let matched = false;
        let levenshteinDistance = 0;
        if (numberedRoad) {
            // This is a numbered road, so we only match if it's a direct name match
            // and return a distance of 0
            if (sanitizedWaypointName === sanitizedStopStreet) {
                matched = true;
                levenshteinDistance = 0;
            }
        } else {
            // This isn't a numbered road, so based on the levenshtein distance we can tell if it matches
            levenshteinDistance = levenshtein.get(sanitizedWaypointName, sanitizedStopStreet);
            if (levenshteinDistance <= 5) {
                matched = true;
            }
        }

        return [matched, levenshteinDistance, wayName];
    }
}

export default Verifier;
