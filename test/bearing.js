'use strict';

import assert from 'assert';
import Stop from '../src/process/Stop.js';
import * as geometry from '../src/process/Geometry.js';

import {
    should,
    expect
} from "chai";

describe('Bearings', function() {
    it('should have south bearing', async function() {
        let stop = new Stop(
            '',
            '',
            '',
            '',
            50.74386345960896,
            -1.8914240598678589
        );

        let bearing = geometry.getRoadBearing(
            [
                50.743158238452054,
                -1.8914481997489927,
            ],
            [
                50.744509266537776,
                -1.8914481997489927,
            ],
            stop
        );

        let compass = geometry.degreesToCompass(bearing);
        expect(compass).to.equal('S');
    });

    it('should have north bearing', async function() {
        let stop = new Stop(
            '',
            '',
            '',
            '',
            50.743849881443886,
            -1.891484409570694
        );

        let bearing = geometry.getRoadBearing(
            [
                50.743158238452054,
                -1.8914481997489927,
            ],
            [
                50.744509266537776,
                -1.8914481997489927,
            ],
            stop
        );

        let compass = geometry.degreesToCompass(bearing);
        expect(compass).to.equal('N');
    });

    it('should have east bearing', async function() {
        let stop = new Stop(
            '',
            '',
            '',
            '',
            50.74398820881628,
            -1.8914267420768738
        );

        let bearing = geometry.getRoadBearing(
            [
                50.7439389880803,
                -1.8922072649002075,
            ],
            [
                50.7439389880803,
                -1.8905925750732422,
            ],
            stop
        );

        let compass = geometry.degreesToCompass(bearing);
        expect(compass).to.equal('E');
    });

    it('should have west bearing', async function() {
        let stop = new Stop(
            '',
            '',
            '',
            '',
            50.74387449186517,
            -1.8914240598678589
        );

        let bearing = geometry.getRoadBearing(
            [
                50.7439389880803,
                -1.8922072649002075,
            ],
            [
                50.7439389880803,
                -1.8905925750732422,
            ],
            stop
        );

        let compass = geometry.degreesToCompass(bearing);
        expect(compass).to.equal('W');
    });

    it('should have north east bearing', async function() {
        let stop = new Stop(
            '',
            '',
            '',
            '',
            50.734126055708515,
            -1.9030916690826414
        );

        let bearing = geometry.getRoadBearing(
            [
                50.732863006920326,
                -1.9047331809997559,
            ],
            [
                50.735389070438636,
                -1.9012838602066038,
            ],
            stop
        );

        let compass = geometry.degreesToCompass(bearing);
        expect(compass).to.equal('NE');
    });

    it('should have south west bearing', async function() {
        let stop = new Stop(
            '',
            '',
            '',
            '',
            50.73395289780856,
            -1.9028180837631228
        );

        let bearing = geometry.getRoadBearing(
            [
                50.732863006920326,
                -1.9047331809997559,
            ],
            [
                50.735389070438636,
                -1.9012838602066038,
            ],
            stop
        );

        let compass = geometry.degreesToCompass(bearing);
        expect(compass).to.equal('SW');
    });

    it('should have north west bearing', async function() {
        let stop = new Stop(
            '',
            '',
            '',
            '',
            50.733582813092,
            -1.9039607048034668,
        );

        let bearing = geometry.getRoadBearing(
            [
                50.73450971701027,
                -1.9052857160568237,
            ],
            [
                50.73287998360835,
                -1.9022870063781738,
            ],
            stop
        );

        let compass = geometry.degreesToCompass(bearing);
        expect(compass).to.equal('NW');
    });

    it('should have south east bearing', async function() {
        let stop = new Stop(
            '',
            '',
            '',
            '',
            50.733749181812605,
            -1.9036012887954712,
        );

        let bearing = geometry.getRoadBearing(
            [
                50.73450971701027,
                -1.9052857160568237,
            ],
            [
                50.73287998360835,
                -1.9022870063781738,
            ],
            stop
        );

        let compass = geometry.degreesToCompass(bearing);
        expect(compass).to.equal('SE');
    });

    it('should have south bearing 2', async function() {
        let stop = new Stop(
            '',
            '',
            '',
            '',
            51.4522598064,
            -0.7515712181,
        );

        let bearing = geometry.getRoadBearing(
            [
                51.4519933,
                -0.7517925
            ],
            [
                51.4523873,
                -0.7515895,
            ],
            stop
        );

        let compass = geometry.degreesToCompass(bearing);
        expect(compass).to.equal('S');
    });
});
