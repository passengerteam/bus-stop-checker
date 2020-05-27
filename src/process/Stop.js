'use strict';

import * as geometry from './Geometry.js';

class Stop {
    constructor(
        atco,
        name,
        street,
        bearing,
        latitude,
        longitude,
        type,
        subType,
        status,
        administrativeAreaCode,
        nptgLocalityCode
    ) {
        this.atco = atco;
        this.name = name;

        if (!street || !/\w/.test(street)) {
            this.street = null;
        } else {
            this.street = street;
        }

        this.bearing = bearing ? String(bearing).toUpperCase() : null;
        this.latitude = parseFloat(latitude);
        this.longitude = parseFloat(longitude);
        this.type = type;
        this.subType = subType;
        this.status = status;

        this.confidenceIsCorrect = 50; // 50 = We don't know anything
        this.bearingDifference = null;
        this.osmBearing = null;
        this.distanceFromRoad = null;
        this.administrativeAreaCode = administrativeAreaCode;
        this.nptgLocalityCode = nptgLocalityCode;
    }

    getAtco() {
        return this.atco;
    }

    getName() {
        return this.name;
    }

    getType() {
        return this.type;
    }

    getSubType() {
        return this.subType;
    }

    getStatus() {
        return this.status;
    }

    setConfidenceIsCorrect(confidence) {
        this.confidenceIsCorrect = confidence;
    }

    getConfidenceIsCorrect() {
        return this.confidenceIsCorrect;
    }

    hasStreet() {
        return null !== this.street;
    }

    getStreet() {
        return this.street;
    }

    hasCoordinates() {
        return this.latitude && this.longitude;
    }

    getLatitude() {
        return this.latitude;
    }

    getLongitude() {
        return this.longitude;
    }

    hasBearing() {
        return null !== this.bearing && this.bearing in geometry.bearingToDegress;
    }

    getBearing() {
        return this.bearing;
    }

    setOsmBearing(bearing) {
        this.osmBearing = bearing;
    }

    getOsmBearing() {
        return this.osmBearing;
    }

    setBearingDifference(difference) {
        this.bearingDifference = difference;
    }

    getBearingDifference() {
        return this.bearingDifference;
    }

    getAdministrativeAreaCode() {
        return this.administrativeAreaCode;
    }

    getNptgLocalityCode() {
        return this.nptgLocalityCode;
    }
}

export default Stop;
