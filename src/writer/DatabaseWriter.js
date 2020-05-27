'use strict';

const {
    Client
} = require('pg').native;

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

class CSVWriter {
    constructor() {
        this.pgClient = new Client({
            host: process.env.OUTPUT_DATABASE_HOST,
            database: process.env.OUTPUT_DATABASE_DATABASE,
            user: process.env.OUTPUT_DATABASE_USERNAME,
            password: process.env.OUTPUT_DATABASE_PASSWORD,
        });
    }

    async init() {
        await this.pgClient.connect();
        console.log('Connected to writer database.');
    }

    async writeLine(lineArr) {
        await this.pgClient.query(query, lineArr);
    }

    async close() {
        await this.pgClient.end();
        this.pgClient = null;
    }
}

export default CSVWriter;
