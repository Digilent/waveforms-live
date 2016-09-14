'use strict';

//Load device descriptor from file
var fs = require("fs");
fs.readFile('./devices/openscope-mz.json', 'utf8', function (err, data) {
    if (err) {
        console.log(err);
    }
    else {
        device.descriptor = JSON.parse(data);
    }
});

let keithTest = fs.readFileSync('./SampleOSJB.osjb');
console.log(Buffer.from(keithTest));

//Statuses    
let statusOk = 0;

//Process binary data to create correct response
let processBinaryDataAndSend = function(commandObject, res) {
    /*let binaryDataContainer = {};
    let binaryOffset = 0;
    console.log(commandObject);
    for (let triggerChannel in commandObject.trigger) {

        for (let instrument in trigger.targets) {

            for (let channel in commandObject.trigger[triggerChannel][0][instrument]) {
                binaryDataContainer[channel] = commandObject.trigger[triggerChannel][0][instrument][channel].y;
                commandObject.trigger[triggerChannel][0][instrument][channel].binaryOffset = binaryOffset;
                binaryOffset += commandObject.trigger[triggerChannel][0][instrument][channel].binaryLength;
                delete commandObject.trigger[triggerChannel][0][instrument][channel].y;
            }

        }

    }

    let stringCommand = JSON.stringify(commandObject);
    let binaryIndex = (stringCommand.length + 2).toString() + '\r\n';
    //binaryIndex = (binaryIndex.toString().length + 2).toString() + '\r\n';
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/octet-stream');
    console.log('Reply: sent');
    res.write(binaryIndex);
    res.write(stringCommand + '\r\n');
    for (let bufferNum in binaryDataContainer) {
        res.write(Buffer.from(binaryDataContainer[bufferNum].buffer));
    }
    res.end();*/

    //Return Keith Data
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/octet-stream');
    res.write(keithTest);
    res.end();
}

//Command Process 
let processCommands = function (instrument, commandObject, params) {
    let command = instrument + commandObject.command;
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
        case 'awggetSetting':
            return awg.getSetting(params[0]);
        case 'awgsetSetting':
            return awg.setSetting(params[0], commandObject.settings);

        case 'awgsetArbitraryWaveform':
            return awg.setArbitraryWaveform(params[0]);
        case 'awgsetRegularWaveform':
            return awg.setRegularWaveform(params[0], commandObject);
        case 'awgrun':
            return awg.run(params[0]);
        case 'awgstop':
            return awg.stop(params[0]);

        //---------- DC ----------        
        case 'dcsetVoltage':
            return dc.setVoltage(params[0], commandObject.voltage);
        case 'dcgetVoltage':
            return dc.getVoltage(params[0]);

        //-------- TRIGGER --------
        case 'triggersetParameters':
            return trigger.setParameters(params[0], commandObject.source, commandObject.targets);
        case 'triggerrun':
            return trigger.run();
        case 'triggerread':
            return trigger.read(params[0]);

        //---------- OSC ----------            
        case 'oscrunSingle':
            return osc.runSingle(params[0]);
        case 'oscsetParameters':
            return osc.setParameters(params[0], commandObject.offset, commandObject.gain);
        default:
            return {
                statusCode: 1,
                errorMessage: 'Not a recognized command'
            };
    }
};

//------------------------------ Handler ------------------------------
exports.handler = (event, context, postResponse) => {  

    //Log event data
    console.log('Event: ', event);

    //Initialize reponse object
    let responseObject = {};
    let sumStatusCode = 0;
    let binaryDataFlag = 0;

    for (let instrument in event) {
        //create property on response object
        responseObject[instrument] = {};
        if (event[instrument][0] !== undefined && event[instrument][0].command !== undefined) {
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
                    console.log(element.command);
                    if (element.command === 'read') {
                        binaryDataFlag = 1;
                    }
                });
                
            }

        }
    }
    responseObject.statusCode = sumStatusCode
    if (binaryDataFlag) {
        processBinaryDataAndSend(responseObject, postResponse);
    }
    else {
        postResponse.setHeader('Access-Control-Allow-Origin', '*');
        postResponse.setHeader('Content-Type', 'application/json');
        console.log('Reply: ', responseObject, '\n');
        postResponse.end(JSON.stringify(responseObject));
    }


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
    signalTypes: ['', '', '', '', '', '', '', ''],
    signalFreqs: [0, 0, 0, 0, 0, 0, 0, 0],
    vpps: [0, 0, 0 , 0, 0, 0, 0, 0],
    vOffsets: [0, 0, 0, 0, 0, 0, 0, 0],

    //Not sure if these are necessary
    numSamples: [0, 0, 0, 0, 0, 0, 0, 0],
    sampleRates: [0, 0, 0, 0, 0, 0, 0, 0],
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

    setArbitraryWaveform: function(chan) {
        return {
            statusCode: 0,
            wait: 0
        };
    },

    setRegularWaveform: function(chan, commandObject) {
        this.signalTypes[chan] = commandObject.signalType;
        this.signalFreqs[chan] = commandObject.signalFreq;
        this.vpps[chan] = commandObject.vpp;
        this.vOffsets[chan] = commandObject.vOffset;
        return {
            statusCode: 0,
            wait: 0
        };
    },

    run: function(chan) {
        return {
            statusCode: 0,
            wait: 0
        }
    },

    stop: function(chan) {
        return {
            statusCode: 0,
            wait: 0
        }
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

//---------------------------- TRIGGER ----------------------------

let trigger = {

    sources: [{
        "instrument": null,
        "channel": null,
        "type": null,
        "lowerThreshold": null,
        "upperThreshold": null
    }],

    targets: {},

    setParameters: function(chan, source, targets) {
        this.sources[chan] = source;
        this.targets = targets;
        return {
            "command": "setParameters",
            "statusCode": 0,
            "wait": 0
        };
    },

    run: function() {
        return {
            "command": "run",
            "statusCode": 0,
            "wait": -1,
            "acqCount": 27
        };
    },

    read: function (chan) {
        let returnInfo = {
            "command": "read",
            "statusCode": 0,
            "wait": 0,
            "acqCount": 27,
        };
        console.log(this.targets);
        for (let instrument in this.targets) {
            returnInfo[instrument] = {};
            this.targets[instrument].forEach((element, index, array) => {
                returnInfo[instrument][index] = {};
                returnInfo[instrument][index] = osc.runSingle(index);
            });

        }

        return returnInfo;
    },

    forceTrigger: function() {
        return {
            "statusCode": 0
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

    offsets: [0, 0, 0],

    gains: [1, 1, 1],

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

    setParameters: function(chan, offset, gain) {
        this.offsets[chan] = offset;
        this.gains[chan] = gain;
        return {
            "command": "setParameters",
            "actualOffset": 3100,
            "statusCode": 0,
            "wait": 0
        };
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
        wf = {
            't0': clockTimeOffset,
            'dt': 0.001,
            'y': typedArray
        };
        //length is 2x the array length because 2 bytes per entry
        return {
            verticalOffset: 0,
            dt: 160000,
            y: typedArray,
            binaryLength: 2 * typedArray.length,
            binaryOffset: null,
            statusCode: statusOk
        };
    }
}

