'use strict';
console.log('Loading function');

let voltages = [0, 0];

exports.handler = (event, context, callback) => {
	
	console.log('test', event.command);
    let statusOk = {statusCode: 0};
    let dc = {
        numChans: 2,
        chans: [
            {
                name: "Channel 0",
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
        ]
     };
  
      switch (event.command) {
        case 'enumerate':
            callback(null, dc);
            break;
        case 'calibrate':
            callback(null, statusOk);
            break;
        case 'getVoltage':
            let response = {
                voltage: getVoltage(event.chan),
                statusCode: 0
            };
            callback(null, response);
            break;
        case 'setVoltage':
            setVoltage(event.chan, event.voltage);
            callback(null, statusOk);
            break;
        default:
            callback(null, 'Unknown Command');
    }
};


//Get Voltage
function getVoltage(channel)
{
    return voltages[channel];
}

//Get Voltage
function setVoltage(channel, voltage)
{
   voltages[channel] = voltage;
}