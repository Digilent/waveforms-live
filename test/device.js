'use strict';
console.log('Loading function');

let device = {
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

exports.handler = (event, context, callback) => {
  
        let response = {};
        
        switch (event.command) {
        case 'enumerate':
            callback(null, device);
            break;
        case 'getMake':
            response = { 
                deviceMake: device.deviceMake,
                statusCode: device.statusCode
            };
            callback(null, response);
            break;
        case 'getModel':
            response = { 
                deviceModel: device.deviceModel,
                statusCode: device.statusCode
            };
            callback(null, response);
            break;
        case 'getFirmwareVersion':
            response = { 
                firmwareVersion: device.firmwareVersion,
                statusCode: device.statusCode
            };
            callback(null, response);
            break;
        case 'getInstruments':
            response = { 
                instruments: device.instruments,
                statusCode: device.statusCode
            };
            callback(null, response);
            break;
        case 'getId':
            response = {
                deviceMake: device.deviceMake,
                deviceModel: device.deviceModel,
                firmwareVersion: device.firmwareVersion,
                statusCode: device.statusCode
            };
            callback(null, response);
            break;
        default:
            callback(null, 'Unknown Command');
    }
};