//Http server
var http = require('http');
const PORT=8080;

//Import instruments 
var oscilloscope = require('./oscilloscope/oscilloscope.js');

//Variables
var postData = '';
var postResponse;

function handleRequest(request, response){
  
	postResponse = response;
	console.log('New Request');
	if(request.method == 'POST')
	{
		//Clear data to accommodate new request
		postData = '';
		
		//Accumulate data as it comes in
		request.on('data', function(data) {
            postData += data;
		});
		
		//Once all data is in call function to handle post data.  Pass in sendReply callback to mirror lambda functionality
		request.on('end', function () {
			oscilloscope.handler(JSON.parse(postData), null, sendReply);
        });
	}
	else
	{
		response.end('Unknown Command');
	}
}

//Create HTTP server
var server = http.createServer(handleRequest);

//Start HTTP server
server.listen(PORT, function(){
  
    console.log("Server listening on: http://localhost:%s", PORT)
});

//Mirrors Lambda functionality by passing response back to requester as the reply body
function sendReply(error, result)
{
	postResponse.setHeader('Access-Control-Allow-Origin', '*');
	postResponse.end(JSON.stringify(result)); 
}