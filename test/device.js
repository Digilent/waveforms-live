'use strict';

//Todo - provide AWS Lambda alternative for loading device
//Load device descriptor from file
var fs = require("fs");
fs.readFile('./devices/openscope-mz.json', 'utf8', function (err, data) {
    if (err) {
        console.log(err);
    }
    else {
        device.descriptor = JSON.parse(data);
        console.log(device.descriptor);
        console.log();
    }
});

//Statuses    
let statusOk = 0;

//------------------------------ Handler ------------------------------
exports.handler = (event, context, callback) => {

    //Parse out command and endpoint to work with Lambda and local NodeJS
    let command = '';
    let endpoint = '/';

    if (event["body-json"]) {
        command = event["body-json"].command;
        endpoint = event.context["resource-path"];
    } else {
        command = event.command;
    }

    //Log event data
    console.log('Event: ', event);
    console.log('Endpoint: ', endpoint);
    console.log('Command: ', command);

    //-------------------- Process Commands --------------------
    switch (endpoint) {
        //---------- Device ----------
        case '/':
            switch (command) {
                case 'enumerate':
                    callback(null, device.enumerate());
                    break;
                case 'getMake':
                    callback(null, device.getMake());
                    break;
                case 'getModel':
                    callback(null, device.getModel());
                    break;
                case 'getFirmwareVersion':
                    callback(null, device.getFirmwareVersion());
                    break;
                case 'getInstruments':
                    callback(null, device.getInstruments());
                    break;
                case 'getId':
                    callback(null, device.getId());
                    break;
                default:
                    callback(null, 'Unknown Command');
            }
            break;

        //---------- AWG ----------
        case '/awg':
            switch (command) {
                case 'calibrate':
                    callback(null, awg.calibrate());
                    break;
                case 'enumerate':
                    callback(null, awg.enumerate());
                    break;
                case 'getOffset':
                    callback(null, awg.getOffset(event['body-json'].chan));
                    break;
                case 'setOffset':
                    callback(null, awg.setOffset(event['body-json'].chan, event['body-json'].offset));
                    break;
                default:
                    callback(null, 'Unknown Command');
            }
            break;

        //---------- DC ----------
        case '/dc':
            switch (command) {
                case 'calibrate':
                    callback(null, dc.calibrate());
                    break;
                case 'enumerate':
                    callback(null, dc.enumerate());
                    break;
                case 'getVoltage':
                    callback(null, dc.getVoltage(event['body-json'].chan));
                    break;
                case 'setVoltage':
                    callback(null, dc.setVoltage(event['body-json'].chan, event['body-json'].voltage));
                    break;
                default:
                    callback(null, 'Unknown Command');
            }
            break;

        //---------- OSC ----------
        case '/osc':
            switch (command) {
                case 'calibrate':
                    callback(null, osc.calibrate());
                    break;
                case 'enumerate':
                    callback(null, osc.enumerate());
                    break;
                default:
                    callback(null, 'Unknown Command');
            }
            break;
    }
};

//------------------------------ Device ------------------------------
let device = {
    descriptor: '',

    //Enumerate
    enumerate: function () {
        let response = this.descriptor;
        response.statusCode = statusOk;
        return response;
    },

    //Get Make
    getMake: function () {
        return this.descriptor.deviceMake;
    },

    //Get Model
    getModel: function () {
        return this.descriptor.deviceModel;
    },

    //Get Firmware Version
    getFirmwareVersion: function () {
        return this.descriptor.firmwareVersion;
    },

    //Get Instruments
    getInstruments: function () {
        return this.descriptor.instruments;
    },

    //Get Id
    getId: function () {
        return {
            deviceMake: this.descriptor.deviceMake,
            deviceModel: this.descriptor.deviceModel,
            firmwareVersion: device.firmwareVersion,
            statusCode: statusOk
        };
    },
}

//------------------------------ AWG ------------------------------
let awg = {
    numSamples: [0, 0, 0, 0, 0, 0, 0, 0],
    sampleRates: [0, 0, 0, 0, 0, 0, 0, 0],
    offsets: [0, 0, 0, 0, 0, 0, 0, 0],
    buffers: [[], [], [], [], [], [], [], []],

    //Calibrate
    calibrate: function () {
        return {
            statusCode: statusOk
        };
    },

    //Enumerate
    enumerate: function () {
        return device.descriptor.awg;
    },

    //Get Offset
    getOffset: function (chan) {
        return {
            offset: this.offsets[chan],
            statusCode: statusOk
        };
    },

    //Set Offset
    setOffset: function (chan, offset) {
        this.offsets[chan] = offset;
        return {
            statusCode: statusOk
        };
    },

    //Set Custom Waveform
    setCustomWaveform: function (chan, numSamples, sampleRate, offset, samples) {
        this.numSamples[chan] = numSamples;
        this.sampleRates[chan] = sampleRate;
        this.offsets[chan] = offset;
        this.samples[chan] = samples;
        return {
            statusCode: statusOk
        };
    },

    //Set Waveform
    setWaveform: function (chan, type, freq, amplitude, offset) {
        return {
            statusCode: statusOk
        };
    }
}

//------------------------------ DC ------------------------------
let dc = {
    voltages: [0, 0, 0, 0, 0, 0, 0, 0],

    //Calibrate
    calibrate: function () {
        return {
            statusCode: statusOk
        };
    },

    //Enumerate
    enumerate: function () {
        return device.descriptor.dc;
    },

    //Get Voltage
    getVoltage: function (chan) {
        return {
            voltage: this.voltages[chan],
            statusCode: statusOk
        };
    },

    //Set Voltage
    setVoltage: function (chan, voltage) {
        this.voltages[chan] = voltage;
        return {
            statusCode: statusOk
        };
    }
}

//------------------------------ AWG ------------------------------
let osc = {
    buffers: [[], [], [], [], [], [], [], []],

    //Calibrate
    calibrate: function () {
        return {
            statusCode: statusOk
        };
    },

    //Enumerate
    enumerate: function () {
        return device.descriptor.osc;
    }
}

