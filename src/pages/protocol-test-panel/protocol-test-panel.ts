import { Component } from '@angular/core';

//Components
import { TransportComponent } from '../../components/transport/transport.component';

//Services
import { StorageService } from '../../services/storage/storage.service';

@Component({
    templateUrl: 'protocol-test-panel.html'
})

export class ProtocolTestPanel {

    public transport: TransportComponent;
    public storage: StorageService;


    public httpMethodNames = ['POST', 'GET'];
    public selectedHttpMethod: string;

    public uri: string = 'http://localhost:8888';
    public numSendHeaders = 1;
    public sendHeaders: Array<Object> = [{}];

    public deviceCommands: Array<string> = ['Device', 'enumerate'];
    public awgCommands: Array<string> = ['AWG', 'setArbitraryWaveform', 'setRegularWaveform', 'run', 'stop'];
    public dcCommands: Array<string> = ['DC', 'getVoltage', 'setVoltage'];
    public oscCommands: Array<string> = ['OSC', 'read', 'setParameters'];
    public triggerCommands: Array<string> = ['Trigger', 'forceTrigger', 'read', 'run', 'single', 'setParameters', 'stop'];
    public gpioCommands: string[] = ['GPIO', 'setParameters', 'read', 'write'];
    public customCommands: string[] = ['CUSTOM', 'one', 'two', 'three', 'four', 'five'];

    public activeCustomCommandNumber: string = 'one';

    public sendBody: string = '';

    public responseHeaders: Array<string> = [];

    public rawResponse: ArrayBuffer;
    public responseBody: string = '';
    public formattedResponseBody: string = '';
    public responseBinaryString: string = '';
    public formattedResponseBinaryString: string = '';

    public responseBodyFormats: Array<string> = ["raw", "json", "osjb"];
    public selectedRepsonseBodyFormat: string;

    public responseRawBinary: ArrayBuffer;
    public responseBinaryFormats: Array<string> = ['i16', 'u16', 'i8', 'u8'];
    public selectedRepsonseBinaryFormat: string;

    public XHR: XMLHttpRequest;

    /* Protocol Commands */
    public commands =
    {
        "device": {
            "enumerate": {
                "device": [
                    {
                        "command": "enumerate"
                    }
                ]
            }
        },
        "awg": {
            "setArbitraryWaveform": {
                "awg": {
                    "1": [
                        {
                            "command": "setArbitraryWaveform",
                            "binaryOffset": 0,
                            "binaryLength": 20000,
                            "binaryType": "I16",
                            "vpp": 3000,
                            "vOffset": 0,
                            "dt": 100000
                        }
                    ]
                }
            },
            "setRegularWaveform": {
                "awg": {
                    "1": [
                        {
                            "command": "setRegularWaveform",
                            "signalType": "sine",
                            "signalFreq": 1000000,
                            "vpp": 3000,
                            "vOffset": 0
                        }
                    ]
                }
            },
            "run": {
                "awg": {
                    "1": [
                        {
                            "command": "run",
                        }
                    ]
                }
            },
            "stop": {
                "awg": {
                    "1": [
                        {
                            "command": "stop",
                        }
                    ]
                }
            }
        },
        "dc": {
            "getVoltage": {
                "dc": {
                    "1": [
                        {
                            "command": "getVoltage"
                        }
                    ]
                }
            },
            "setVoltage": {
                "dc": {
                    "1": [
                        {
                            "command": "setVoltage",
                            "voltage": 3300
                        }
                    ]
                }
            }
        },
        "custom": {
            "one": {
                "custom": 1
            },
            "two": {
                "custom": 2
            },
            "three": {
                "custom": 3
            },
            "four": {
                "custom": 4
            },
            "five": {
                "custom": 5
            }
        },
        "gpio": {
            "setParameters": {
                "gpio": {
                    "1": [
                        {
                            "command": "setParameters",
                            "direction": "input"
                        }
                    ],
                    "2": [
                        {
                            "command": "setParameters",
                            "direction": "output"
                        }
                    ]
                }
            },
            "read": {
                "gpio": {
                    "1": [
                        {
                            "command": "read"
                        }
                    ]
                }
            },
            "write": {
                "gpio": {
                    "2": [
                        {
                            "command": "write",
                            "value": 1
                        }
                    ]
                }
            }
        },
        "osc": {
            "read": {
                "osc": {
                    "1": [
                        {
                            "command": "read",
                            "acqCount": 2
                        }
                    ],
                    "2": [
                        {
                            "command": "read",
                            "acqCount": 2
                        }
                    ]
                }
            },
            "setParameters": {
                "osc": {
                    "1": [
                        {
                            "command": "setParameters",
                            "offset": 0,
                            "gain": 1
                        }
                    ]
                }
            }
        },
        "trigger": {
            "forceTrigger": {
                "trigger": {
                    "1": [
                        {
                            "command": "forceTrigger"
                        }
                    ]
                }
            },
            "setParameters": {
                "trigger": {
                    "1": [
                        {
                            "command": "setParameters",
                            "source": {
                                "instrument": "osc",
                                "channel": 1,
                                "type": "risingEdge",
                                "lowerThreshold": -5,
                                "upperThreshold": 0
                            },
                            "targets": {
                                "osc": [
                                    1
                                ]
                            }
                        }
                    ]
                }
            },
            "read": {
                "trigger": {
                    "1": [
                        {
                            "command": "read"
                        }
                    ]
                }
            },
            "run": {
                "trigger": {
                    "1": [
                        {
                            "command": "run"
                        }
                    ]
                }
            },
            "single": {
                "trigger": {
                    "1": [
                        {
                            "command": "single"
                        }
                    ]
                }
            },
            "stop": {
                "trigger": {
                    "1": [
                        {
                            "command": "stop"
                        }
                    ]
                }
            }
        }
    };
    public activeCommand: Object;


    constructor(_storage: StorageService) {
        console.log('ProtocolTestPanel Constructor');
        this.storage = _storage;
        this.selectedHttpMethod = this.httpMethodNames[0];
        this.selectedRepsonseBodyFormat = this.responseBodyFormats[0];
        this.selectedRepsonseBinaryFormat = this.responseBinaryFormats[0];

        this.loadState();

    }


    //Returns true if the selected response type contains binary
    isBinaryResponse() {
        if (this.selectedRepsonseBodyFormat == 'osjb') {
            return true;
        }
        return false;
    }

    //Called when http method value changes
    onHttpMethodValueChange(data) {
        this.selectedHttpMethod = data.value;
    }

    //Called when user selects new response body format
    onResponseBodyFormatChange(data) {
        this.selectedRepsonseBodyFormat = data.value;
        this.formatResponse(data.value);
    }

    //Called when user selects new response binary format (control only visible when body type contains binary)
    onResponseBinaryFormatChange(data) {
        this.selectedRepsonseBinaryFormat = data.value;
        this.formatBinary(data.value);
    }

    //Format raw binary data into string with specified fromatting for display 
    formatBinary(format: string) {
        console.log(format, this.responseBinaryString);
        let dataArray;
        switch (format) {
            case "u8":
                //this.formattedResponseBinaryString = new Uint8Array(this.responseRawBinary).toString();
                dataArray = new Uint8Array(this.responseRawBinary);
                break;
            case "i8":
                dataArray = new Int8Array(this.responseRawBinary);
                break;
            case "u16":
                dataArray = new Uint16Array(this.responseRawBinary);
                break;
            case "i16":
                dataArray = new Int16Array(this.responseRawBinary);
                break;
            default:
                break;
        }

        let dataString = '';
        let binNum = 8;
        for (let i = 0; i < dataArray.length; i++) {
            dataString += dataArray[i].toString() + ",\t";
            if ((i + 1) % binNum == 0) {
                dataString += "\r\n";
            }
        }

        this.formattedResponseBinaryString = dataString;
    }

    //Format the response body into a string with the specified format for display
    formatResponse(format: string) {
        //Try will catch invalid JSON errors and prevent execution from stopping
        try {
            switch (format) {
                case "json":
                    let tempJson = JSON.parse(this.responseBody);
                    this.formattedResponseBody = JSON.stringify(tempJson, undefined, 4);
                    break;
                case "osjb":
                    let leadingAsciiLength = this.responseBody.indexOf('\r\n') + 2;
                    let jsonLength = parseFloat(this.responseBody.substring(0, leadingAsciiLength - 2));
                    let command = JSON.parse(this.responseBody.substring(leadingAsciiLength, leadingAsciiLength + jsonLength));

                    this.responseRawBinary = this.rawResponse.slice(leadingAsciiLength + jsonLength);
                    this.formattedResponseBody = JSON.stringify(command, undefined, 4);
                    this.responseBinaryString = this.responseBody.substring(leadingAsciiLength + jsonLength);
                    this.formatBinary(this.selectedRepsonseBinaryFormat);
                    break;
                case "raw":
                    this.formattedResponseBody = this.responseBody;
                    break;
                default:
                    break;
            }
        }
        catch (err) {
            console.log(err);
            if (format == "json") {
                this.formattedResponseBody = "Response Is Not Invalid JSON";
            }
        }
    }

    //Add a new request header row
    addHeader() {
        this.sendHeaders.push({
            "key": "",
            "value": ""
        });
        this.numSendHeaders++;
    }

    //Remove a request header row
    removeHeader(index: number) {
        this.sendHeaders.splice(index, 1);
        this.numSendHeaders--;
    }

    //Callback called when a device command template is selected
    onDeviceCommandChange(data) {
        switch (data.value) {
            case "enumerate":
                this.sendBody = JSON.stringify(this.commands.device.enumerate);
                this.activeCommand = this.commands.device.enumerate;
                break;
            default:
                this.sendBody = "";
                break;
        }
    }

    //Callback called when an AWG command template is selected
    onAwgCommandChange(data) {
        switch (data.value) {
            case "setRegularWaveform":
                this.sendBody = JSON.stringify(this.commands.awg.setRegularWaveform);
                this.activeCommand = this.commands.awg.setRegularWaveform;
                break;
            case "setArbitraryWaveform":
                this.sendBody = JSON.stringify(this.commands.awg.setArbitraryWaveform);
                this.activeCommand = this.commands.awg.setArbitraryWaveform;
                break;
            case "run":
                this.sendBody = JSON.stringify(this.commands.awg.run);
                this.activeCommand = this.commands.awg.run;
                break;
            case "stop":
                this.sendBody = JSON.stringify(this.commands.awg.stop);
                this.activeCommand = this.commands.awg.stop;
                break;
            default:
                this.sendBody = "";
                break;
        }
    }

    //Callback called when a DC command template is selected
    onDcCommandChange(data) {
        switch (data.value) {
            case "getVoltage":
                this.sendBody = JSON.stringify(this.commands.dc.getVoltage);
                this.activeCommand = this.commands.dc.getVoltage;
                break;
            case "setVoltage":
                this.sendBody = JSON.stringify(this.commands.dc.setVoltage);
                this.activeCommand = this.commands.dc.setVoltage;
                break;
            default:
                this.sendBody = "";
                break;
        }
    }

    //Callback called when a OSC command template is selected
    onOscCommandChange(data) {
        switch (data.value) {
            case "read":
                this.sendBody = JSON.stringify(this.commands.osc.read);
                this.activeCommand = this.commands.osc.read;
                break;
            case "setParameters":
                this.sendBody = JSON.stringify(this.commands.osc.setParameters);
                this.activeCommand = this.commands.osc.setParameters;
                break;
            default:
                this.sendBody = "";
                break;
        }
    }

    //Callback called when a Trigger command template is selected
    onTriggerCommandChange(data) {
        switch (data.value) {
            case "forceTrigger":
                this.sendBody = JSON.stringify(this.commands.trigger.forceTrigger);
                this.activeCommand = this.commands.trigger.forceTrigger;
                break;
            case "setParameters":
                this.sendBody = JSON.stringify(this.commands.trigger.setParameters);
                this.activeCommand = this.commands.trigger.setParameters;
                break;
            case "read":
                this.sendBody = JSON.stringify(this.commands.trigger.read);
                this.activeCommand = this.commands.trigger.read;
                break;
            case "run":
                this.sendBody = JSON.stringify(this.commands.trigger.run);
                this.activeCommand = this.commands.trigger.run;
                break;
            case "single":
                this.sendBody = JSON.stringify(this.commands.trigger.single);
                this.activeCommand = this.commands.trigger.single;
                break;
            case "stop":
                this.sendBody = JSON.stringify(this.commands.trigger.stop);
                this.activeCommand = this.commands.trigger.stop;
                break;
            default:
                this.sendBody = "";
                break;
        }
    }

    //Callback called when a GPIO command template is selected
    onGpioCommandChange(data) {
        switch (data.value) {
            case "setParameters":
                this.sendBody = JSON.stringify(this.commands.gpio.setParameters);
                this.activeCommand = this.commands.gpio.setParameters;
                break;
            case "read":
                this.sendBody = JSON.stringify(this.commands.gpio.read);
                this.activeCommand = this.commands.gpio.read;
                break;
            case "write":
                this.sendBody = JSON.stringify(this.commands.gpio.write);
                this.activeCommand = this.commands.gpio.write;
                break;
            default:
                this.sendBody = "";
                break;
        }
    }

    //Callback called when a custom command template is selected
    onCustomCommandChange(data) {
        switch (data.value) {
            case "one":
                this.sendBody = JSON.stringify(this.commands.custom.one);
                this.activeCommand = this.commands.custom.one;
                this.activeCustomCommandNumber = 'one';
                break;
            case "two":
                this.sendBody = JSON.stringify(this.commands.custom.two);
                this.activeCommand = this.commands.custom.two;
                this.activeCustomCommandNumber = 'two';
                break;
            case "three":
                this.sendBody = JSON.stringify(this.commands.custom.three);
                this.activeCommand = this.commands.custom.three;
                this.activeCustomCommandNumber = 'three';
                break;
            case "four":
                this.sendBody = JSON.stringify(this.commands.custom.four);
                this.activeCommand = this.commands.custom.four;
                this.activeCustomCommandNumber = 'four';
                break;
            case "five":
                this.sendBody = JSON.stringify(this.commands.custom.five);
                this.activeCommand = this.commands.custom.five;
                this.activeCustomCommandNumber = 'five';
                break;
            default:
                this.sendBody = "";
                break;
        }
    }

    //Send the specified header/body to the specified URL
    send() {
        //Clear Previous Response
        this.responseBody = '';
        this.formatResponse('raw');

        this.XHR = new XMLHttpRequest();

        //Callback on successful response
        this.XHR.addEventListener("load", function (event) {
            //Populate response headers
            let responseHeaders = this.XHR.getAllResponseHeaders().split("\n");
            responseHeaders.forEach((element: string, index) => {
                if (element != '' && element != undefined) {
                    let tokens = element.split(':');
                    this.responseHeaders[index] = {
                        'key': tokens[0].trim(),
                        'value': tokens[1].trim()
                    }
                }
            });

            //Parse Response            
            this.rawResponse = event.currentTarget.response;
            let byteArray = new Int8Array(this.rawResponse);
            let stringBuffer = '';
            let start = performance.now();
            for (let i = 0; i < byteArray.length; i++) {
                let char = '';
                char = String.fromCharCode.apply(null, new Int8Array(this.rawResponse.slice(i, i + 1)));
                stringBuffer += char;
            }
            let finish = performance.now();
            console.log(finish - start);
            this.responseBody = stringBuffer;
            //this.responseBody = String.fromCharCode.apply(null, new Int8Array(this.rawResponse));
            this.formatResponse(this.selectedRepsonseBodyFormat);
        }.bind(this));

        //Callback on error
        this.XHR.addEventListener("error", function (event) {
            this.responseBody = "Device did not respond.  Check the console for more information";
            this.formatResponse(this.selectedRepsonseBodyFormat);
        }.bind(this));

        this.XHR.open(this.selectedHttpMethod, this.uri);

        //Set resposne type as arraybuffer to receive response as bytes
        this.XHR.responseType = 'arraybuffer';

        //Add Headers To Send
        this.sendHeaders.forEach((element: any) => {
            if (element.key != '' && element.key != undefined) {
                this.XHR.setRequestHeader(element.key, element.value);
            }
        })
        console.log(this.sendBody);
        this.XHR.send(this.sendBody);
    }

    abort() {
        this.XHR.abort();
        console.log('XHR Abort');
    }

    //Callback called when uri input changes
    onUrlInputChange(data) {
        //Store value in local storage to load on next init
        this.storage.saveData('uri', data);
    }

    //Save text box states
    saveState() {
        this.storage.saveData('uri', this.uri);
        this.storage.saveData('sendHeaders', JSON.stringify(this.sendHeaders));
        this.storage.saveData('responseHeaders', JSON.stringify(this.responseHeaders));
        try {
            let byteArray = new Int8Array(this.rawResponse);
            let stringBuffer = '';
            for (let i = 0; i < byteArray.length; i++) {
                let char = '';
                char = String.fromCharCode.apply(null, new Int8Array(this.rawResponse.slice(i, i + 1)));
                stringBuffer += char;
            }
            this.storage.saveData('responseRawBinary', stringBuffer);
        }
        catch (e) {
            console.log(e);
            console.log('Error Saving Raw Binary Response');
        }
        this.storage.saveData('responseBody', this.responseBody);
        this.attemptCommandSave();
    }

    attemptCommandSave() {
        console.log('attempting command save');
        console.log(this.activeCommand);
        if (this.activeCommand['custom'] !== undefined) {
            try {
                let sendBodyObject = JSON.parse(this.sendBody);
                this.commands.custom[this.activeCustomCommandNumber] = sendBodyObject;
            }
            catch (e) {
                console.log(e);
                console.log('error saving commands');
            }
        }
        else {
            try {
                let sendBodyObject = JSON.parse(this.sendBody);
                for (let instrument in this.activeCommand) {
                    for (let channel in this.activeCommand[instrument]) {
                        this.commands[instrument][this.activeCommand[instrument][channel][0].command] = sendBodyObject;
                        this.storage.saveData('commands', JSON.stringify(this.commands));
                        console.log('Custom Command Saved into LocalStorage');
                    }
                }

            }
            catch (e) {
                console.log(e);
                console.log('error saving commands');
            }
        }
    }

    //Load Saved statesl
    loadState() {

        this.storage.getData('uri').then((value) => {
            this.uri = value;
        });
        this.storage.getData('sendHeaders').then((value) => {
            if (value != null && value != 'null') {
                this.sendHeaders = JSON.parse(value);
            } else {
                this.sendHeaders = [{}];
            }

        });
        this.storage.getData('responseHeaders').then((value) => {
            if (value != null && value != 'null') {
                this.responseHeaders = JSON.parse(value);
            } else {
                this.responseHeaders = [];
            }
        });
        this.storage.getData('commands').then((value) => {
            if (value !== null && value != 'null') {
                this.commands = JSON.parse(value);
            }
        });


        /*

        //Converting binary to base64 below does not work correctly 

        this.storage.getData('responseBody').then((value) => {
            this.responseBody = value;
            this.formatResponse(this.selectedRepsonseBodyFormat);
        });
        this.storage.getData('responseRawBinary').then((value) => {
            this.responseRawBinary = new Uint8Array(atob(value).split("").map(function (c) {
                return c.charCodeAt(0);
            }));;
            this.formatBinary(this.selectedRepsonseBinaryFormat);
        });
        */
    }

    chartData() {
        alert('Removed');
    }
}