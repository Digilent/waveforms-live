'use strict';

//Todo - provide AWS Lambda alternative for loading device
var fs = require("fs");

let deviceDescriptor = '';

//Load device descriptor from file
fs.readFile('./devices/openscope-mz.json', 'utf8', function (err, data) {
    if (err) {
        console.log(err);
    }
    else {        
        deviceDescriptor = data;
        console.log(deviceDescriptor);
    }
});

//------------------------------ Device ------------------------------

let device = {
    endpoint: '',
    deviceMake: "Digilent",
    deviceModel: "OpenScope-MZ",
    firmwareVersion: {
        major: 1,
        minor: 0,
        patch: 0
    },
    instruments: {
        awg: {
            numChans: 1,
            chans: [],
        },
        dc: {
            numChans: 2,
            chans: [
                {
                    name: "Channel Name 0",
                    voltageMin: -4000,
                    voltageMax: 4000,
                    voltageIncrement: 50,
                    currentMin: 0,
                    currentMax: 500,
                    currentIncrement: 0
                },
                {
                    name: "Current Supply 0",
                    voltageMin: 0,
                    voltageMax: 5000,
                    voltageIncrement: 0,
                    currentMin: 0,
                    currentMax: 1000,
                    currentIncrement: 1
                }
            ],
        },
        la: {
            numChans: 8,
            chans: []
        },
        osc: {
            numChans: 2,
            chans: []
        },
    },
    statusCode: 0
};


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
    console.log('');
    
    let response = {};

    //-------------------- Process Commands --------------------
    switch (endpoint) {
        //---------- Device ----------
        case '/':
            switch (command) {
                case 'enumerate':
                    callback(null, device);
                    break;
                case 'getMake':
                    response = {
                        deviceMake: device.deviceMake,
                        statusCode: statusOk
                    };
                    callback(null, response);
                    break;
                case 'getModel':
                    response = {
                        deviceModel: device.deviceModel,
                        statusCode: statusOk
                    };
                    callback(null, response);
                    break;
                case 'getFirmwareVersion':
                    response = {
                        firmwareVersion: device.firmwareVersion,
                        statusCode: statusOk
                    };
                    callback(null, response);
                    break;
                case 'getInstruments':
                    response = {
                        instruments: device.instruments,
                        statusCode: statusOk
                    };
                    callback(null, response);
                    break;
                case 'getId':
                    response = {
                        deviceMake: device.deviceMake,
                        deviceModel: device.deviceModel,
                        firmwareVersion: device.firmwareVersion,
                        statusCode: statusOk
                    };
                    callback(null, response);
                    break;
                default:
                    callback(null, 'Unknown Command');
            }
            break;

        //---------- DC ----------
        case '/dc':
            switch (command) {
                case 'enumerate':
                    callback(null, device.instruments.dc);
                    break;
                case 'calibrate':
                    response = {
                        statusCode: statusOk
                    };
                    callback(null, response);
                    break;
                case 'getVoltage':
                    response = {
                        voltage: getVoltage(event['body-json'].chan),
                        statusCode: 0
                    };
                    callback(null, response);
                    break;
                case 'setVoltage':
                    setVoltage(event['body-json'].chan, event['body-json'].voltage);
                    callback(null, statusOk);
                    break;
                default:
                    callback(null, 'Unknown Command');
            }
            break;
    }
};


//------------------------------ DC ------------------------------
let voltages = [0, 0, 0, 0, 0, 0, 0, 0];

//Get Voltage
function getVoltage(channel) {
    return voltages[channel];
}

//Get Voltage
function setVoltage(channel, voltage) {
    voltages[channel] = voltage;
}



