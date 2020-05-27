'use strict';

import 'core-js/stable';
import 'regenerator-runtime/runtime';
import 'dotenv/config';
import BusStopChecker from './BusStopChecker';

const program = require('commander');

program
    .command('process <naptanFile> <osmFile>')
    .option('-o, --output <file>', 'File to store the output csv.', 'output.csv')
    .option('-d, --database', 'Store the data in a database', false)
    .option('-t, --threads <number>', 'Number of processing threads', null)
    .option('-b, --batchSize <number>', 'Number of processing threads', null)
    .description('Process a Stops file.')
    .action(async (naptanFile, osmFile, cmd) => {
        let busStopChecker = new BusStopChecker();
        await busStopChecker.process(naptanFile, osmFile, cmd.output, cmd.database, cmd.threads, cmd.batchSize);
    });

if (0 === process.argv.slice(2).length) {
    program.outputHelp();
    process.exit(0);
}

program.parse(process.argv);
