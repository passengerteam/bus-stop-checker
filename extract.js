#!/usr/bin/env node

const osmium = require('osmium');
const fs = require('fs');

var levelup = require('levelup')
var leveldown = require('leveldown')


var file = new osmium.File('./great-britain-latest.osm.pbf');
var reader = new osmium.Reader(file, {
    node: true
});
var handler = new osmium.Handler();

var db = levelup(leveldown('./nodes'))

var nodes = 0;
var batchSize = 100;
var displayBatchSize = 10000000;
var batch = db.batch();

async function writeData() {
    return new Promise(resolve => {
        let batchLength = batch.length;
        batch.write(function(err) {
            if (err)
                console.log('Ooops!', err)

            nodes += batchLength;
            if (0 === (nodes % displayBatchSize)) {
                console.log(nodes);
            }

            batch = null;
            batch = db.batch();
            resolve();
        });
    });
}

async function readNextNode(node) {
    return new Promise(async function(resolve) {
        if (node.constructor.name === 'Node') {
            batch.put(node.id, node.location.lat + ',' + node.location.lon);
        }

        if (batch.length >= batchSize) {
            await writeData();
        }
        resolve(true);
    });
}

async function start() {
    let buffer;
    while (buffer = reader.read()) {
        let object;
        while (object = buffer.next()) {
            await readNextNode(object);
        }
    }
}

start();
