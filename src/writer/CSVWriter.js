'use strict';

import fs from 'fs';
import stringify from 'csv-stringify/lib/sync';

class CSVWriter {
    constructor(outputFile) {
        this.file = fs.createWriteStream(outputFile);

        let head = stringify([
            [
                'ATCOCode',
                'Latitude',
                'Longitude',
                'Bearing',
                'Street',
                'OSM Street',
                'Confidence Is Correct',
                'Road Bearing',
                'Difference',
                'Distance From Road',
                'Administrative Area Code',
                'Common Name',
                'NPTG Locality Code',
                'OSM Node A Latitude',
                'OSM Node A Longitude',
                'OSM Node A ID',
                'OSM Node B Latitude',
                'OSM Node B Longitude',
                'OSM Node B ID',
            ]
        ]);

        this.file.write(head);
    }

    async init() {

    }

    async writeLine(lineArr) {
        if (lineArr) {
            let line = stringify([lineArr]);
            this.file.write(line);
        }
    }

    async close() {
        this.file.close();
    }
}

export default CSVWriter;
