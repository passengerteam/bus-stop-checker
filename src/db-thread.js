#!/usr/bin/env node

var multilevel = require('multilevel');
var net = require('net');
var level = require('level');

var db = level('./nodes');


console.log('Database Thread Launched.');
module.exports = function(stop, done) {
    return new Promise(resolve => {
        net.createServer(function(con) {
            con.pipe(multilevel.server(db)).pipe(con);
        }).listen(3000, function() {
            console.log('Database started.');
            resolve(true);
        });
    });
};
