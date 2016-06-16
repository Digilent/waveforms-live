//Http server
let http = require('http');
let dispatcher = require('httpdispatcher');
const PORT = 8080;

//Import instruments 
let device = require('./device.js');
var dc = require('./dc.js');

//Variables
let postResponse;

function handleRequest(request, response) {
    try {
        //log the request on console
        console.log(request.url);
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
    res.writeHead(200, {'Content-Type': 'text/plain'});
    res.end('SilverNeedle Device Simulator');
});

dispatcher.onPost("/", (req, res) => {    
    postResponse = res;    
    console.log(JSON.parse(req.body));   
    device.handler(JSON.parse(req.body), null, sendReply);

});

//DC Instrument
dispatcher.onPost("/dc", (req, res) => {    
    postResponse = res;
    console.log('New Request');
    console.log(JSON.parse(req.body));   
    dc.handler(JSON.parse(req.body), null, sendReply);

});

//Create HTTP server
var server = http.createServer(handleRequest);

//Start HTTP server
server.listen(PORT, function () {
    console.log("Server listening on: http://localhost:%s", PORT)
});

//Mirrors Lambda functionality by passing response back to requester as the reply body
function sendReply(error, result) {   
    postResponse.setHeader('Access-Control-Allow-Origin', '*');
    postResponse.end(JSON.stringify(result));
}