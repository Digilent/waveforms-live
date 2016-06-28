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

    //Parse out command    
    let command = event.command;

    //Log event data
    console.log('Event: ', event);
    console.log('Command: ', command);

    //-------------------- Process Commands --------------------    
    switch (command) {

        //---------- Device ----------
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

        //---------- AWG ----------            
        case 'awgCalibrate':
            callback(null, awg.calibrate());
            break;
        case 'awgEnumerate':
            callback(null, awg.enumerate());
            break;
        case 'awgGetOffsets':
            callback(null, awg.getOffsets(event.chans));
            break;
        case 'awgSetOffsets':
            callback(null, awg.setOffsets(event.chans, event.offsets));
            break;

        //---------- DC ----------            
        case 'dcCalibrate':
            callback(null, dc.calibrate());
            break;
        case 'dcEnumerate':
            callback(null, dc.enumerate());
            break;
        case 'dcGetVoltages':
            callback(null, dc.getVoltages(event.chans));
            break;
        case 'dcSetVoltages':
            callback(null, dc.setVoltages(event.chans, event.voltages));
            break;

        //---------- OSC ----------            
        case 'oscCalibrate':
            callback(null, osc.calibrate());
            break;
        case 'oscEnumerate':
            callback(null, osc.enumerate());
            break;
        case 'oscRunSingle':
            callback(null, osc.runSingle(event.chans));
            break;
        default:
            callback(null, 'Unknown Command');
    }
};

//------------------------------ Device ------------------------------
let device = {
    descriptor: '',

    //Enumerate
    enumerate: function () {
        let response = device.descriptor;
        response.statusCode = statusOk;
        console.log(response);
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
        let response = device.descriptor.instruments.awg;
        response.statusCode = statusOk;
        console.log(response);
        return response;
    },

    //Get Offset
    getOffsets: function (_chans) {
        let _offsets = [];
        for (let i = 0; i < _chans.length; i++) {
            _offsets.push(this.offsets[_chans[i]]);
        }
        return {
            offsets: _offsets,
            statusCode: statusOk
        };
    },

    //Set Offset
    setOffsets: function (_chans, _offsets) {
        for (let i = 0; i < _chans.length; i++) {
            this.offsets[_chans[i]] = _offsets[i];
        };
        return {
            statusCode: statusOk
        };
    },

    //Set Custom Waveform
    setCustomWaveforms: function (chan, numSamples, sampleRate, offset, samples) {
        this.numSamples[chan] = numSamples;
        this.sampleRates[chan] = sampleRate;
        this.offsets[chan] = offset;
        this.samples[chan] = samples;
        return {
            statusCode: statusOk
        };
    },

    //Set Waveform
    setWaveforms: function (chan, type, freq, amplitude, offset) {
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
        let response = device.descriptor.instruments.dc;
        response.statusCode = statusOk;
        console.log(response);
        return response;
    },

    //Get Voltages
    getVoltages: function (_chans) {
        let _voltages = [];
        for (let i = 0; i < _chans.length; i++) {
            _voltages.push(this.voltages[_chans[i]]);
        }
        return {
            voltages: _voltages,
            statusCode: statusOk
        };
    },

    //Set Voltages
    setVoltages: function (_chans, _voltages) {
        for (let i = 0; i < _chans.length; i++) {
            this.voltages[_chans[i]] = _voltages[i];
        };
        return {
            statusCode: statusOk
        };
    }
}

//------------------------------ OSC ------------------------------
let osc = {
    buffers: [
        [1000, 2000, 3000, 4000, 5000, 6000, 7000, 8000, 9000],
        [1000, 2000, 3000, 4000, 5000, 6000, 7000, 8000, 9000],
        [],
        [],
        [],
        []
    ],

    //Calibrate
    calibrate: function () {
        return {
            statusCode: statusOk
        };
    },

    //Enumerate
    enumerate: function () {
        let response = device.descriptor.instruments.osc;
        response.statusCode = statusOk;
        console.log(response);
        return response;
    },

    //Run Single
    runSingle: function (chans) {
        let wf = [];

        //Prepare buffer to send
        for (let i = 0; i < chans.length; i++) {
            wf[i] = {
                t0: 0,
                dt: 1,
                y: this.buffers[chans[i]]
            };

            //TODO REMOVE - SIM - Increment voltages to alter signal
            for (let j = 0; j < this.buffers[chans[i]].length; j++) {
                this.buffers[chans[i]][j] = this.buffers[chans[i]][j] + 1000;
            }
        }

        return {
            waveforms: wf,
            statusCode: statusOk
        };
    }
}

