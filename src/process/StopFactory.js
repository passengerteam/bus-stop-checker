'use strict';

import Stop from './Stop.js';

class StopFactory {
    constructor() {}

    fromArray(rawStop) {
        let stop = new Stop(
            rawStop.ATCOCode,
            rawStop.CommonName,
            rawStop.Street,
            rawStop.Bearing,
            rawStop.Latitude,
            rawStop.Longitude,
            rawStop.StopType,
            rawStop.BusStopType,
            rawStop.Status,
            rawStop.AdministrativeAreaCode,
            rawStop.NptgLocalityCode,
        );

        return stop;
    }
}

export default StopFactory;
