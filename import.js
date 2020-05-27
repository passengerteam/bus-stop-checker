#!/usr/bin/env node

require('should');
const parse = require('csv-parse');
const {
    Pool,
    spawn
} = require('threads');
const {
    Client
} = require('pg');
const fs = require('fs');
const os = require('os');
const protobufs = require('protocol-buffers-stream');
const writeStream = protobufs(fs.readFileSync(__dirname + '/verification.proto'))();
const outputFile = fs.createWriteStream('verifications.pbf');
writeStream.pipe(outputFile);
var dataDate = 0;

if (process.argv.length >= 3) {
    dataDate = process.argv[2];
} else {
    dataDate = Math.floor(new Date() / 1000);
}

// Setup postgres
const client = new Client({
    statement_timeout: 60000,
});

// Setup threads
const cpus = os.cpus();
const batchSize = 40 * cpus.length;
const pool = new Pool();
console.log('Using ' + cpus.length + ' verification threads on ' + cpus[0].model + '.');

// Counters
var stops = 0;
var dbTransactions = 0;
var interval = null;

const query = `insert into
    stop (
        atco,
        latitude,
        longitude,
        naptan_bearing,
        naptan_street,
        osm_street,
        confidence_is_correct,
        road_bearing,
        difference,
        distance_from_road,
        admin_area,
        common_name,
        locality,
        osm_node_alat,
        osm_node_alon,
        osm_node_aid,
        osm_node_blat,
        osm_node_blon,
        osm_node_bid
    ) values (
        $1,
        $2,
        $3,
        $4,
        $5,
        $6,
        $7,
        $8,
        $9,
        $10,
        $11,
        $12,
        $13,
        $14,
        $15,
        $16,
        $17,
        $18,
        $19
    ) on conflict (atco) do update set
        atco = Excluded.atco,
        latitude = Excluded.latitude,
        longitude = Excluded.longitude,
        naptan_bearing = Excluded.naptan_bearing,
        naptan_street = Excluded.naptan_street,
        osm_street = Excluded.osm_street,
        confidence_is_correct = Excluded.confidence_is_correct,
        road_bearing = Excluded.road_bearing,
        difference = Excluded.difference,
        distance_from_road = Excluded.distance_from_road,
        admin_area = Excluded.admin_area,
        common_name = Excluded.common_name,
        locality = Excluded.locality,
        osm_node_alat = Excluded.osm_node_alat,
        osm_node_alon = Excluded.osm_node_alon,
        osm_node_aid = Excluded.osm_node_aid,
        osm_node_blat = Excluded.osm_node_blat,
        osm_node_blon = Excluded.osm_node_blon,
        osm_node_bid = Excluded.osm_node_bid;
`;

pool
    .on('done', async function(job, message) {
        if (message) {
            dbTransactions++;
            await client.query(query, message);
            writeStream.verification({
                name: message[0],
                latitude: message[1],
                longitude: message[2],
                bearing: message[3],
                street: message[4],
                osmStreet: message[5],
                confidence_is_correct: message[6],
                roadBearing: message[7],
                difference: message[8],
                distance_from_road: message[9],
                admin_area: message[10],
                common_name: message[11],
                locality: message[12],
                osm_node_a_lat: message[13],
                osm_node_a_lon: message[14],
                osm_node_a_id: message[15],
                osm_node_b_lat: message[16],
                osm_node_b_lon: message[17],
                osm_node_b_id: message[18],
            });
            dbTransactions--;
        }

        stops++;
    })
    .on('error', function(job, error) {
        console.error('Job errored:', job);
    });

const dbThread = spawn(__dirname + '/src/db-thread.js');

function sleep(ms) {
    return new Promise(resolve => {
        setTimeout(resolve, ms)
    })
}

function processStop(stop) {
    pool
        .run(__dirname + '/src/verify-thread.js')
        .send(stop);
}

var closing = false;
async function exitProgram() {
    if (!closing) {
        closing = true;
        console.log('Finished');
        console.log(pool);
        while (pool.jobQueue.length > 0) {
            console.log('Jobs left in pool:', pool.jobQueue.length);
            await sleep(1000);
        }
        writeStream.end();
        pool.killAll();
        await client.query('INSERT INTO import (date) VALUES ($1);', [dataDate]);
        await client.end();
        dbThread.kill();
        clearInterval(interval);
        process.exit(0);
    }
}

var parser = parse({
    columns: true,
    skip_lines_with_error: true
});
var ended = false;
async function readLine() {
    if (!closing) {
        if (pool.jobQueue.length < batchSize && dbTransactions < 50) {
            if (data = parser.read()) {
                processStop(data);
            } else if (ended && pool.jobQueue.length === 0 && dbTransactions === 0) {
                exitProgram();
                return;
            }
            setTimeout(readLine, 10);
        } else {
            setTimeout(readLine, 100);
        }
    }
}

parser.on('end', function() {
    ended = true;
});

parser.on('readable', readLine);

async function main() {
    await client.connect();
    fs.createReadStream('./Stops.csv').pipe(parser);

    console.log('Stops, Stops currently processing / batch size, DB transactions open')
    interval = setInterval(function() {
        console.log(stops + ' ' + pool.jobQueue.length + '/' + batchSize + ' ' + dbTransactions);
    }, 5000);

    setTimeout(function() {
        console.log('Hit Timeout');
        exitProgram();
    }, 7200000);
}


dbThread.on('message', function(response) {
    console.log('Starting verificiation.');
    main();
});

dbThread.send();
