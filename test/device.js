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

//Command Process 
let processCommands = function (instrument, commandObject, params) {
    let command = instrument + commandObject.command;
    console.log(command);
    switch (command) {
        //---------- Device ----------
        case 'deviceenumerate':
            return device.enumerate();
            //break;
        case 'getMake':
            //callback(null, device.getMake());
            break;
        case 'getModel':
            //callback(null, device.getModel());
            break;
        case 'getFirmwareVersion':
            //callback(null, device.getFirmwareVersion());
            break;
        case 'getInstruments':
            //callback(null, device.getInstruments());
            break;
        case 'getId':
            //callback(null, device.getId());
            break;

        //---------- AWG ----------            
        case 'awgCalibrate':
            //callback(null, awg.calibrate());
            break;
        case 'awgEnumerate':
            //callback(null, awg.enumerate());
            break;
        case 'awgGetOffsets':
            //callback(null, awg.getOffsets(event.chans));
            break;
        case 'awgSetOffsets':
            //callback(null, awg.setOffsets(event.chans, event.offsets));
            break;
        case 'awggetSetting':
        console.log('get settings');
            return awg.getSetting(params[0]);
        case 'awgsetSetting':
            console.log('set settings');
            return awg.setSetting(params[0], commandObject.settings);

        //---------- DC ----------            
        case 'dcCalibrate':
            //callback(null, dc.calibrate());
            break;
        case 'dcEnumerate':
            //callback(null, dc.enumerate());
            break;
        case 'dcGetVoltages':
            //callback(null, dc.getVoltages(event.chans));
            break;
        case 'dcSetVoltages':
            //callback(null, dc.setVoltages(event.chans, event.voltages));
            break;
        case 'dcsetVoltage':
            return dc.setVoltage(params[0], commandObject.voltage);
        case 'dcgetVoltage':
            return dc.getVoltage(params[0]);

        //---------- OSC ----------            
        case 'oscCalibrate':
            //callback(null, osc.calibrate());
            break;
        case 'oscEnumerate':
            //callback(null, osc.enumerate());
            break;
        case 'oscrunSingle':
            return osc.runSingle(params[0]);
        default:
        //callback(null, 'Unknown Command');
    }
};

//------------------------------ Handler ------------------------------
exports.handler = (event, context, callback) => {  

    //Log event data
    console.log('Event: ', event);

    //Initialize reponse object
    let responseObject = {};
    let sumStatusCode = 0;

    for (let instrument in event) {
        //create property on response object
        responseObject[instrument] = {};
        if (event[instrument][0].command !== undefined) {
            if (instrument === 'device') {
                responseObject[instrument] = [];
                let activeIndex = responseObject[instrument].push(processCommands(instrument, event[instrument][0], [])) - 1;
                sumStatusCode += responseObject[instrument][activeIndex].statusCode;
            }
            else {
                responseObject[instrument] = processCommands(instrument, event[instrument][0], []);
                sumStatusCode += responseObject[instrument].statusCode;
            }

        }

        for (let channel in event[instrument]) {
            if (event[instrument][channel][0] !== undefined) {
                //create property on response object 
                responseObject[instrument][channel] = [];
                event[instrument][channel].forEach((element, index, array) => {
                    let activeIndex = responseObject[instrument][channel].push(processCommands(instrument, event[instrument][channel][index], [channel])) - 1;
                    sumStatusCode += responseObject[instrument][channel][activeIndex].statusCode;
                });
                
            }

        }
    }
    responseObject.statusCode = sumStatusCode
    callback(null, responseObject);

}  
    

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
    },

    //Get All Settings
    getSetting: function (chan) {
        let settings = {};


        settings.numSamples = this.numSamples[parseInt(chan)];
        settings.sampleRate = this.sampleRates[parseInt(chan)];
        settings.offset = this.offsets[parseInt(chan)];


        return {
            settings: settings,
            statusCode: statusOk
        };
    },

    //Set All Settings
    setSetting: function (chan, settings) {
        this.numSamples[parseInt(chan)] = settings.numSamples;
        this.sampleRates[parseInt(chan)] = settings.sampleRate;
        this.offsets[parseInt(chan)] = settings.offset;
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

    getVoltage: function(_chan, _voltage) {
        return {
            command: 'getVoltage',
            voltage: this.voltages[_chan],
            statusCode: statusOk,
            wait: 100
        }
    },

    setVoltage: function(_chan, _voltage) {
        console.log('setting ' + _chan + ' to ' + _voltage + 'mV');
        this.voltages[_chan] = _voltage;
        return {
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
    runSingle: function (chan) {

        //---------- Simulate Signal ----------
        //Set default values
        let sampleRate = 1000;
        let numSamples = 1000;
        let sigFreq = 100;
        let t0 = 0;
        let phaseOffset = 0;

        //Calculate dt - time between data points
        var dt = 1 / sampleRate * 1000;

        //Calculate start time offset to simulate continuously running signal
        var d = new Date();
        //Clock time in seconds.  Rolls ever every hour.
        var clockTimeOffset = (d.getTime() % 3600000) / 1000;

        //Build Y point arrays
        let wf = null;

        let y = [];
        for (var j = 0; j < numSamples; j++) {
            y[j] = parseInt(1000 * Math.sin((Math.PI / 180) * ((360 * ((dt / 1000 * j * sigFreq) + clockTimeOffset)) + phaseOffset + 90 * parseInt(chan))));
        }
        let typedArray = new Int16Array(y);
        //console.log(Buffer.from(typedArray));
        wf = {
            't0': clockTimeOffset,
            'dt': dt,
            'y': y
        };


        return {
            waveform: wf,
            statusCode: statusOk
        };
    }
}

