import {Component} from '@angular/core';

@Component({
  templateUrl: 'build/pages/home/home.html',
  directives: []
})

export class HomePage {
  constructor() {
    console.log('Home Constructor');
  }

  sendData() {
    var XHR = new XMLHttpRequest();

    let FD = new FormData();

    let command = {
      "awg": {
        "0": [
          {
            "command": "writeBuffer"
          }
        ]
      }
    };

    FD.append('commands', JSON.stringify(command));
    FD.append('buffer0', 'THIS COULD BE SOME BINARY DATA...WHY NOT?');

    // We define what will happen if the data are successfully sent
    XHR.addEventListener("load", function (event) {
      console.log('response received');
      let megaString = String.fromCharCode.apply(null, new Int8Array(event.currentTarget.response.slice(0)));
      let binaryIndexStringLength = megaString.indexOf('\r\n');
      let binaryIndex = parseFloat(megaString.substring(0, binaryIndexStringLength));
      console.log(binaryIndex);
      let command = JSON.parse(megaString.substring(binaryIndexStringLength + 2, binaryIndex));
      console.log(command);
      let data = new Int16Array(event.currentTarget.response.slice(binaryIndex));
      console.log(data);
    });

    // We define what will happen in case of error
    XHR.addEventListener("error", function (event) {
      console.log('TX Error: ', event);
    });


    // We setup our request
    XHR.open("POST", "http://localhost:8888/binary");
    XHR.responseType = 'arraybuffer';
    // The data sent are the one the user provide in the form
    XHR.send(FD);
  }
}