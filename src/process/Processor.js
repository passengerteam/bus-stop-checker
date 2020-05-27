'use strict';

import {
    Pool,
    spawn,
    Worker
} from 'threads';

import fs from 'fs';
import os from 'os';
import parse from 'csv-parse';

function sleep(ms) {
    return new Promise(resolve => {
        setTimeout(resolve, ms);
    });
}

class Processor {
    constructor(naptanFile, osmFile) {
        this.naptanFile = naptanFile;
        this.osmFile = osmFile;
    }

    async process(stopCallback, threads, batchSize) {
        let self = this;
        this.stopCallback = stopCallback;
        this.stopsWritten = 0;
        this.stopsRead = 0;
        this.jobQueue = 0;

        // Setup threads
        let cpus = os.cpus();
        this.threads = threads || (cpus.length - 1);
        this.batchSize = batchSize || (40 * this.threads);

        console.log('Using %s verification threads on %s with a batch size of %s.', this.threads, cpus[0].model, this.batchSize);

        this.pool = Pool(() => spawn(new Worker('./Verify.thread.js', {
            type: 'module'
        })), {
            size: this.threads
        });

        await this.main();
    }

    async main() {
        let self = this;

        console.log('Stops Read / Stops Written, Stops currently processing / batch size');
        let interval = setInterval(function() {
            console.log('%s/%s %s/%s', self.stopsRead, self.stopsWritten, self.jobQueue, self.batchSize);
        }, 5000);

        let readStream = fs.createReadStream(this.naptanFile);
        await this.initParser(readStream);
        clearInterval(interval);
    }

    initParser(readStream) {
        let self = this;

        return new Promise((resolve) => {
            let parser = parse({
                columns: true,
                skip_lines_with_error: true,
                trim: true,
            });

            parser.on('readable', async () => {
                let paused = false;
                if (self.jobQueue >= self.batchSize) {
                    paused = true;
                    //console.log('Suspended %s/%s', self.jobQueue, self.batchSize);
                    readStream.unpipe(parser);
                }

                while (self.jobQueue >= self.batchSize) {
                    await sleep(100);
                }

                if (paused) {
                    readStream.pipe(parser);
                    //console.log('Resumed %s/%s', self.jobQueue, self.batchSize);
                }

                await self.readFile(parser);
            });


            parser.on('end', async () => {
                console.log('Finished reading file');
                while (self.jobQueue > 0) {
                    console.log('Jobs left in pool:', self.jobQueue);
                    await sleep(1000);
                }
                console.log('Finished processing stops');
                await self.pool.completed(true);
                await self.pool.terminate();
                resolve();
            });

            parser.on('error', function(err) {
                console.log(err);
            });

            readStream.pipe(parser);
        });
    }

    async readFile(parser) {
        let data;
        do {
            data = parser.read();
            if (data) {
                await this.processStop(data);
            }
        } while (data);
    }

    async processStop(stop) {
        let self = this;
        self.jobQueue++;
        self.stopsRead++;
        self.pool.queue(async processStop => {
            const response = await processStop(stop, self.osmFile);
            self.jobQueue--;
            self.stopsWritten++;
            await self.stopCallback(response);
        });
    }
}

export default Processor;
