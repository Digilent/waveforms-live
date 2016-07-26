//Http server
let http = require('http');
let dispatcher = require('httpdispatcher');
var fs = require("fs");

//Configure Port
let port = 8080;
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
    let command = {
        "osc": {
            "0": [
                {
                    "command": "runSingle",
                    "statusCode": 0,
                    "wait": 100
                }
            ]
        }
    };

    res.writeHead(200, {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'multipart/form-data; boundary=----WebKitFormBoundarya0sbopXx2fAewhB6'
    });
    let body = "------WebKitFormBoundarylBu1yd0XWA4m1C6A\r\n"
    body += "Content-Disposition: form-data; name=\"commands\"\r\n\r\n";
    body += JSON.stringify(command) + "\r\n";
    body += "------WebKitFormBoundarylBu1yd0XWA4m1C6A\r\n"
    res.write(body, 'utf8');

    //Manually Create Binary Buffer
    /*
    let data = new Int16Array(2);
    data[0] = 0b0000110011100100;  //3300
    data[1] = 0b0001001110001000;  //5000
    res.write(Buffer.from(data.buffer));    //Gets a reference of type buffer to the array data 
    */

    //Load binary data from hex file
    res.write("Content-Disposition: form-data; name=\"buffer0\"\r\nContent-Type: application/octet-stream\r\n\r\n", 'utf8');
    data = fs.readFileSync('./dataBuffer.hex', 'binary');
    res.write(Buffer.from(data));
    res.write("\r\n------WebKitFormBoundarylBu1yd0XWA4m1C6A--\r\n", 'utf8');
    
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
server.listen(port, function () {
    console.log("Server listening on: http://localhost:%s\n", port)
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
