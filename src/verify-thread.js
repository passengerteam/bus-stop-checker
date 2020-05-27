#!/usr/bin/env node

const OSRM = require('osrm');
const levenshtein = require('fast-levenshtein');
const math = require('mathjs');
const geometry = require('./geometry.js');

var multilevel = require('multilevel');
var net = require('net');

var db = multilevel.client();
var con = net.connect(3000);
con.pipe(db.createRpcStream()).pipe(con);

var osrm = new OSRM({
    path: './great-britain-latest.osrm',
    algorithm: 'MLD'
});

function findOsmNodes(waypoints, stopStreet) {
    let sanitizedStopStreet = stopStreet.replace(/ /g, '').toLowerCase();
    let osmNodes = {
        nodes: [],
        location: []
    };
    let osmStreet = null;
    let closestMatch = null;
    let distanceFromRoad = null;
    if (sanitizedStopStreet !== '') {
        for (var index = 0; index < waypoints.length; index++) {
            let waypoint = waypoints[index];
            if (!waypoint['name'].length) {
                continue;
            }

            let sanitizedWaypointName = waypoint['name'].replace(/ /g, '').toLowerCase();
            if (!sanitizedWaypointName.length) {
                continue;
            }

            let levenshteinDistance = levenshtein.get(sanitizedWaypointName, sanitizedStopStreet);
            if (sanitizedWaypointName === '' || levenshteinDistance <= 3) {
                if (waypoint['nodes'][0] == 0 || waypoint['nodes'][1] == 0 || waypoint['nodes'][0] == waypoint['nodes'][1]) {
                    continue;
                }

                // If not first match
                if (closestMatch !== null) {
                    // If better match
                    if (closestMatch[1] > levenshteinDistance || (closestMatch[1] === levenshteinDistance && closestMatch[2] > waypoint.distance)) {
                        closestMatch = [index, levenshteinDistance, waypoint.distance];
                    }
                } else {
                    closestMatch = [index, levenshteinDistance, waypoint.distance];
                }
            }
        }
    }

    if (closestMatch !== null) {
        let waypoint = waypoints[closestMatch[0]];
        osmNodes = {
            nodes: waypoint['nodes'],
            location: waypoint['location']
        };
        osmStreet = waypoint['name'];
        distanceFromRoad = waypoint.distance;
    }

    return {
        osmNodes: osmNodes,
        osmStreet: osmStreet,
        distanceFromRoad: distanceFromRoad
    };
}

async function getOsmData(stop) {
    return new Promise(resolve => {
        if (!stop.Street || !stop.Longitude || !stop.Latitude) {
            resolve(false);
            return;
        }
        osrm.nearest({
            coordinates: [
                [stop.Longitude, stop.Latitude]
            ],
            radiuses: [10],
            number: 2147483647
        }, function(err, result) {
            if (!err && result.hasOwnProperty('waypoints')) {
                let data = findOsmNodes(result.waypoints, stop.Street);
                resolve(data);
            } else {
                resolve(false);
            }
        });
    });
}

async function getOsmNodeLocation(node) {
    return new Promise(resolve => {
        db.get(node, function(err, value) {
            if (err || !value) {
                resolve(false);
                return;
            }

            let arr = value.split(',');
            arr[0] = parseFloat(arr[0]);
            arr[1] = parseFloat(arr[1]);
            resolve(arr);
        });
    });
}

function getRoadBearing(nodeAlocation, nodeBLocation, stop, osmData) {
    let roadBearing = geometry.getRoadBearing(nodeAlocation, nodeBLocation, stop);
    let roadBearingCompass = geometry.degreesToCompass(roadBearing);
    return {
        bearing: roadBearing,
        compass: roadBearingCompass
    };
}

function buildResponse(stop, osmData, nodeALocation, nodeBLocation) {
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
        stop.ATCOCode,
        stop.Latitude,
        stop.Longitude,
        stop.Bearing,
        stop.Street,
        (osmData && osmData.osmStreet) ? osmData.osmStreet : null,
        stop.confidence_is_correct,
        stop.road_bearing,
        stop.difference,
        (osmData && osmData.distanceFromRoad) ? osmData.distanceFromRoad : null,
        stop.AdministrativeAreaCode,
        stop.CommonName,
        stop.NptgLocalityCode,
        osmNodeALat,
        osmNodeALon,
        osmNodeAId,
        osmNodeBLat,
        osmNodeBLon,
        osmNodeBId,
    ];

    return response;
}

async function verifiyStop(stop) {
    return new Promise(async function(resolve) {
        if (stop.StopType !== 'BCT' || stop.Status === 'del') {
            resolve(false);
            return;
        }

        stop.Longitude = parseFloat(stop.Longitude);
        stop.Latitude = parseFloat(stop.Latitude);
        stop.Bearing = stop.Bearing ? String(stop.Bearing).toUpperCase() : '';
        stop.road_bearing = '';
        stop.confidence_is_correct = 50;
        stop.difference = null;
        stop.distance_from_road = null;
        if (!stop.Street || !/\w/.test(stop.Street)) {
            stop.Street = null;
        }

        if (stop.BusStopType !== 'FLX') {
            if (!stop.Bearing || !stop.Bearing.length || !(stop.Bearing in geometry.bearingToDegress)) {
                stop.confidence_is_correct = 20;
            }
        }

        let osmData = await getOsmData(stop);
        let nodeALocation = null;
        let nodeBLocation = null;
        if (osmData && osmData.osmNodes && osmData.osmNodes.nodes && osmData.osmNodes.nodes.length) {
            nodeALocation = await getOsmNodeLocation(osmData.osmNodes.nodes[0]);
            nodeBLocation = await getOsmNodeLocation(osmData.osmNodes.nodes[1]);
            if (nodeALocation && nodeBLocation) {
                var roadBearing = getRoadBearing(nodeALocation, nodeBLocation, stop, osmData);
                if (roadBearing.bearing) {
                    stop.road_bearing = roadBearing.compass;
                    if (stop.Bearing && stop.Bearing.length && (stop.Bearing in geometry.bearingToDegress)) {
                        stop.difference = math.abs(geometry.differenceBetweenBearings(geometry.bearingToDegress[stop.Bearing], roadBearing.bearing));
                        if (stop.difference > 90) {
                            stop.confidence_is_correct = 25;
                        } else if (stop.difference > 75) {
                            stop.confidence_is_correct = 30;
                        } else if (stop.difference > 60) {
                            stop.confidence_is_correct = 35;
                        } else if (stop.difference > 45) {
                            stop.confidence_is_correct = 45;
                        } else {
                            stop.confidence_is_correct = 80;
                        }
                    }
                }
            }
        }

        resolve(buildResponse(stop, osmData, nodeALocation, nodeBLocation));
    });
}

console.log('Verification Thread Launched.');
module.exports = function(stop, done) {
    return verifiyStop(stop, done);
};
