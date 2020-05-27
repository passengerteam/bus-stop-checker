'use strict';

import * as math from 'mathjs';

const bearingToDegress = {
    N: 0,
    NE: 45,
    E: 90,
    SE: 135,
    S: 180,
    SW: 225,
    W: 270,
    NW: 315,
};

// Converts from degrees to radians
let radians = function(degrees) {
    return degrees * (Math.PI / 180);
};

// Converts from radians to degrees.
let degrees = function(radians) {
    return radians * (180 / Math.PI);
};

function getBearing(pointA, pointB, inDegrees = false) {
    let lat1 = radians(pointA[0]);
    let lat2 = radians(pointB[0]);

    let diffLong = radians(pointB[1] - pointA[1]);

    let x = math.sin(diffLong) * math.cos(lat2);
    let y = math.cos(lat1) * math.sin(lat2) - (math.sin(lat1) * math.cos(lat2) * math.cos(diffLong));

    let initialBearing = math.atan2(x, y);

    if (inDegrees) {
        // Now we have the initial bearing but math.atan2 return values
        // from -180° to + 180° which is not what we want for a compass bearing
        // The solution is to normalize the initial bearing as shown below
        initialBearing = degrees(initialBearing);
        initialBearing = (initialBearing + 360) % 360;
    }

    return initialBearing;
}


function crossProductSign(a, b, c) {
    let d = (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
    return d;
}

function degreesToCompass(angle) {
    let directions = 8;

    let degree = 360 / directions;
    angle = angle + degree / 2;

    if (angle >= 0 * degree && angle < 1 * degree)
        return 'N';
    if (angle >= 1 * degree && angle < 2 * degree)
        return 'NE';
    if (angle >= 2 * degree && angle < 3 * degree)
        return 'E';
    if (angle >= 3 * degree && angle < 4 * degree)
        return 'SE';
    if (angle >= 4 * degree && angle < 5 * degree)
        return 'S';
    if (angle >= 5 * degree && angle < 6 * degree)
        return 'SW';
    if (angle >= 6 * degree && angle < 7 * degree)
        return 'W';
    if (angle >= 7 * degree && angle < 8 * degree)
        return 'NW';
    return '';
}

function differenceBetweenBearings(b1, b2) {
    return 180 - math.abs(math.abs(b1 - b2) - 180);
}

function pointDistanceFromLine(x, y, x1, y1, x2, y2) {
    let A = x - x1;
    let B = y - y1;
    let C = x2 - x1;
    let D = y2 - y1;

    let dot = A * C + B * D;
    let len_sq = C * C + D * D;
    let param = -1;
    if (len_sq != 0) //in case of 0 length line
        param = dot / len_sq;

    let xx, yy;

    if (param < 0) {
        xx = x1;
        yy = y1;
    } else if (param > 1) {
        xx = x2;
        yy = y2;
    } else {
        xx = x1 + param * C;
        yy = y1 + param * D;
    }

    let dx = x - xx;
    let dy = y - yy;
    return Math.sqrt(dx * dx + dy * dy);
}

function getRoadBearing(nodeA, nodeB, stop) {
    let stopCoordinates = [stop.getLatitude(), stop.getLongitude()];

    let roadBearing = getBearing(nodeA, nodeB, true);

    // keep road_bearing within range 0-180
    if (roadBearing > 180) {
        roadBearing = roadBearing - 180;
        let swap = function(x) {
            return x;
        };
        nodeB = swap(nodeA, nodeA = nodeB);
    }

    let sign = crossProductSign(nodeA, nodeB, stopCoordinates);
    if (sign >= 0) {
        // stop is on the opposite side of the road, so we mirror the road bearing
        roadBearing = roadBearing + 180;
    }

    return roadBearing;
}


export {
    bearingToDegress,
    getBearing,
    crossProductSign,
    degreesToCompass,
    differenceBetweenBearings,
    pointDistanceFromLine,
    getRoadBearing
};
