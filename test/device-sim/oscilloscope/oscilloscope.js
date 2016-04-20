'use strict';

/**
 * Provide an event that contains the following keys:
 *
 *   - operation: one of the operations in the switch statement below
 *   - tableName: required for operations that interact with DynamoDB
 *   - payload: a parameter to pass to the operation being performed
 */
exports.handler = (event, context, callback) => {
    //console.log("Event: ", event);
    //console.log("Context: ", context);
    const operation = event.operation;

    switch (event.mode) {
        case 'ping':
            callback(null, 'pong');
            break;
        case 'single':
            //Set default values
            var sampleRate = 1000;
            var numSamples = 1000;
            var sigFreq = 100;
            var t0 = 0;
            var phaseOffset = 0;
            
            //Override defaults with parameters passed in from requestor
            if(event.sampleRate){
                sampleRate = event.sampleRate;
            }
            
            if(event.numSamples){
                numSamples = event.numSamples;
            }
            
            if(event.sigFreq){
                sigFreq = event.sigFreq;
            }
            if(event.t0){
                t0 = event.t0;
            }
            if(event.phaseOffset){
                phaseOffset = event.phaseOffset;
                //console.log(event.phaseOffset);
            }
            
            //Calculate dt - time between data points
            var dt = 1/sampleRate * 1000;
            
            //Calculate start time offset to simulate continuously running signal
            var d = new Date();
            //Clock time in seconds.  Rolls ever every hour.
            var clockTimeOffset = (d.getTime() % 3600000) / 1000; 
            
            //Build data points
            var y = [];
            for (var i = 0; i < numSamples; i++) { 
                y[i] = Math.sin((Math.PI / 180)*((360*((dt/1000*i*sigFreq)+clockTimeOffset))+phaseOffset));
            }
            
            var waveform = {
                't0': clockTimeOffset,
                'dt': dt,
                'y': y,
            };
            
            callback(null, waveform);
            break;
        default:
            callback(null, 'Unknown Command');
            callback(new Error(`Unrecognized operation "${operation}"`));
    }
};