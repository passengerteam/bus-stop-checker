'use strict';

import assert from 'assert';
import Verifier from '../src/process/Verifier.js';
import Stop from '../src/process/Stop.js';

import {
    should,
    expect
} from "chai";

describe('Verifier', function() {
    var verifier;
    this.timeout(5000);

    it('should successfully construct', async function() {
        verifier = new Verifier('/data/great-britain-latest.osm.pbf');
        expect(verifier).to.be.an.instanceof(Verifier);
    });

    it('should successfully init', async function() {
        await verifier.init();
    });

    it('should verify stop 1280POA05727', async function() {
        let stop = new Stop(
            '1280POA05727',
            'Shapwick Road',
            'Norton Way',
            'SW',
            50.7114076918,
            -1.9967752405,
            'BCT',
            'MKD',
            'act',
            '043',
            'E0040696',
        );

        let response = await verifier.verify(stop);
        expect(response).to.be.an.instanceof(Array);
        expect(response).to.have.property(0).with.valueOf(stop.getAtco());
        expect(response).to.have.property(6).with.valueOf(25);
    });

    it('should verify stop 0380G217C394', async function() {
        let stop = new Stop(
            '0380G217C394',
            'Syngenta Layby',
            'Syngenta Site Prive Road',
            'W',
            51.4528229688,
            -0.7462020111,
            'BCT',
            'CUS',
            'act',
            '006',
            'E0035416',
        );

        let response = await verifier.verify(stop);
        expect(response).to.be.an.instanceof(Array);
        expect(response).to.have.property(0).with.valueOf(stop.getAtco());
        expect(response).to.have.property(6).with.valueOf(50);
    });

    it('should verify stop 0380F845C325', async function() {
        let stop = new Stop(
            '0380F845C325',
            'Maidenhead Road',
            'Maidenhead Road',
            'S',
            51.4522598064,
            -0.7515712181,
            'BCT',
            'CUS',
            'act',
            '006',
            'E0035416',
        );

        let response = await verifier.verify(stop);
        expect(response).to.be.an.instanceof(Array);
        expect(response).to.have.property(0).with.valueOf(stop.getAtco());
        expect(response).to.have.property(6).with.valueOf(80);
    });

    it('should successfully deconstruct', async function() {
        await verifier.destruct();
    });
});
