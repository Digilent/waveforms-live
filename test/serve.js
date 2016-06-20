//Http server
let http = require('http');
let dispatcher = require('httpdispatcher');

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
        //log the request on console
        //console.log(request);
        //Disptach
        dispatcher.dispatch(request, response);
    } catch (err) {
        console.log(err);
    }
}

//For all your static (js/css/images/etc.) set the directory name (relative path).
dispatcher.setStatic('resources');

//Device Root
dispatcher.onGet("/", (req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('SilverNeedle Device Simulator');
});

dispatcher.onPost("/", (req, res) => {
    //res.writeHead(200, {'Content-Type': 'application/json'});
    postResponse = res;
    device.handler(JSON.parse(req.body), null, sendReply);
});


//DC Instrument
/*
command = event["body-json"].command;
        endpoint = event.context["resource-path"];
        */
dispatcher.onPost('/dc', (req, res) => {
    let event = JSON.parse(req.body);
    event = setEndpoint(event, '/dc');
    postResponse = res;
    device.handler(event, null, sendReply);
});


//Create HTTP server
var server = http.createServer(handleRequest);

//Start HTTP server
server.listen(port, function () {
    console.log("Server listening on: http://localhost:%s\n", port)
});

//Mirrors Lambda functionality by passing response back to requester as the reply body
function sendReply(error, result) {
    postResponse.setHeader('Access-Control-Allow-Origin', '*');
    postResponse.end(JSON.stringify(result));
}

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
