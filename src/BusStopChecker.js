'use strict';

import Processor from './process/Processor';
import CSVWriter from './writer/CSVWriter';
import DatabaseWriter from './writer/DatabaseWriter';

class BusStopChecker {
    constructor() {}

    async process(naptanFile, osmFile, outputFile, outputToDatabase, threads, batchSize) {
        console.log('Processing %s & %s to %s', naptanFile, osmFile, outputFile);
        let processor = new Processor(naptanFile, osmFile);

        let writer;
        if (true === outputToDatabase) {
            writer = new DatabaseWriter();
        } else {
            writer = new CSVWriter(outputFile);
        }

        await writer.init();
        await processor.process(async (stop) => {
            await writer.writeLine(stop);
        }, threads, batchSize);
        await writer.close();
    }
}

export default BusStopChecker;
