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
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.end('Silver Needle Device Simulator');
});

//Device Root OPTIONS
dispatcher.onOptions("/", (req, res) => {
    console.log('options request');
    optionsResponse = res;
    optionsResponse.setHeader('Access-Control-Allow-Origin', '*');
    optionsResponse.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    optionsResponse.setHeader('Access-Control-Max-Age', 86400);
    optionsResponse.end('Options Response Successful');
});

//Device Root POST
dispatcher.onPost("/", (req, res) => {
    postResponse = res;
    let dataType = req.headers["content-type"];
    if (dataType === 'application/json') {
        device.handler(JSON.parse(req.body), null, res);
    }
    else if (dataType === 'application/octet-stream') {
        console.log('binary data hi');
        res.setHeader('Access-Control-Allow-Origin', '*');
        let dummyResponse = {
            awg: {
                1: [
                    {
                        command: 'setArbitraryWaveform',
                        statusCode: 0,
                        wait: 0
                    }
                ]
            }
        }
        res.end(JSON.stringify(dummyResponse));
    }
    else {
        try {
            console.log('Unidentified content-type: Attempting JSON parse');
            device.handler(JSON.parse(req.body), null, res);
        }
        catch(error) {
            console.log('Error occurred. Sending dummy response');
            console.log(error);
            res.setHeader('Access-Control-Allow-Origin', '*');
            let dummyResponse = {
                awg: {
                    1: [
                        {
                            command: 'setArbitraryWaveform',
                            statusCode: 0,
                            wait: 0
                        }
                    ]
                }
            }
            res.end(JSON.stringify(dummyResponse));
        }
        
    }
    
});

//Echo POST
dispatcher.onPost("/echo", (req, res) => {
    console.log(req);
    postResponse = res;
    postResponse.setHeader('Access-Control-Allow-Origin', '*');
    postResponse.end('Logged');
});

//Create HTTP server
var server = http.createServer(handleRequest);

//Start HTTP server
server.listen(port, hostname, function () {
    console.log("Server listening on: http://%s:%s\n", hostname, port);
});
