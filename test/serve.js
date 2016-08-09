//Http server
let http = require('http');
let dispatcher = require('httpdispatcher');
var fs = require("fs");

//Configure Port
let hostname = '0.0.0.0';
let port = 8888;
if (process.argv[2]) {
    port = process.argv[2];
}

//Import instruments 
let device = require('./device.js');

//Variables
let postResponse;

function handleRequest(request, response) {
    try {
        dispatcher.dispatch(request, response);
    } catch (err) {
        console.log(err);
    }
}

//For all your static (js/css/images/etc.) set the directory name (relative path).
dispatcher.setStatic('resources');

//Device Root GET
dispatcher.onGet("/", (req, res) => {

    res.end('Silver Needle Device Simulator');
});

//Device Root POST
dispatcher.onPost("/", (req, res) => {
    postResponse = res;
    device.handler(JSON.parse(req.body), null, sendReply);
});

//Echo POST
dispatcher.onPost("/echo", (req, res) => {
    console.log(req);
    postResponse = res;
    postResponse.setHeader('Access-Control-Allow-Origin', '*');
    postResponse.end('Logged');
});

//Binary Test Data
dispatcher.onPost("/binary", (req, res) => {
    res.writeHead(200, {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/octet-stream'
    });
    
    let command = {
        "osc": {
            "0": [
                {
                    "command": "read"
                }
            ]
        }
    };
    let stringCommand = JSON.stringify(command);
    let binaryIndex = stringCommand.length;
    binaryIndex = (binaryIndex + binaryIndex.toString().length + 2).toString() + '\r\n';
    console.log(binaryIndex);
    let rawFileRead = fs.readFileSync('./dataBuffer.hex');
    console.log(typeof(rawFileRead), rawFileRead.length);
    let data = new Int16Array(rawFileRead.length / 2);
    for (let i = 0, j = 0; i < rawFileRead.length; i = i + 2, j++) {
        data[j] = rawFileRead[i] << 8 | rawFileRead[i + 1];
    }
    res.write(binaryIndex);
    res.write(stringCommand);
    res.write(Buffer.from(data.buffer), null);
    res.end();
});

/*
//AWG Instrument
dispatcher.onPost('/awg', (req, res) => {
    let event = JSON.parse(req.body);
    event = setEndpoint(event, '/awg');
    postResponse = res;
    device.handler(event, null, sendReply);
});

//DC Instrument
dispatcher.onPost('/dc', (req, res) => {
    let event = JSON.parse(req.body);
    event = setEndpoint(event, '/dc');
    postResponse = res;
    device.handler(event, null, sendReply);
});

//OSC Instrument
dispatcher.onPost('/osc', (req, res) => {
    let event = JSON.parse(req.body);
    event = setEndpoint(event, '/osc');
    postResponse = res;
    device.handler(event, null, sendReply);
});
*/

//Create HTTP server
var server = http.createServer(handleRequest);

//Start HTTP server
//server.listen(port, hostname, function () {
server.listen(port, hostname, function () {
    console.log("Server listening on: http://%s:%s\n", hostname, port);
});

//Mirrors Lambda functionality by passing response back to requester as the reply body
function sendReply(error, result) {
    postResponse.setHeader('Access-Control-Allow-Origin', '*');
    console.log('Reply: ', result, '\n');
    postResponse.end(JSON.stringify(result));
}

/*
//Set device endpoint and command to be compatible with AWS Lambda
function setEndpoint(event, endpoint) {

    //Move JSON body to event.body-json
    event = { 'body-json': event };

    //Set endpoint in event.context.resource-path
    if (event.context) {
        event.context['resource-path'] = endpoint;
    }
    else {
        event.context = { 'resource-path': endpoint };
    }

    return event;
}
*/
