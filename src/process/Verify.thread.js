'use strict';

import {
    expose
} from 'threads/worker';

import path from 'path';

import Verifier from './Verifier.js';

let verifier = null;

expose(async (stop, osmFile) => {
    if (verifier === null) {
        console.log('Verification Thread Launched.');
        verifier = new Verifier('/' + osmFile);
        await verifier.init();
        console.log('Verification Thread Ready.');
    }

    let response;
    try {
        response = await verifier.verify(stop, true);
    } catch (e) {
        console.log(e);
        return false;
    }

    return response;
});
