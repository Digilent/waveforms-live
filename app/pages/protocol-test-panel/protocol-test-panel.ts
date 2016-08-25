import {Component} from '@angular/core';

//Components
import {TransportComponent} from '../../components/transport/transport.component';
import {HttpTransportComponent} from '../../components/transport/http-transport.component';
import {DropDownMenu} from '../../libs/digilent-ionic2-utilities/drop-down-menu/drop-down-menu.component';

@Component({
    templateUrl: 'build/pages/protocol-test-panel/protocol-test-panel.html',
    directives: [DropDownMenu]
})

export class ProtocolTestPanel {

    private transport: TransportComponent;
    private httpMethodNames = ['POST', 'GET'];
    private selectedHttpMethod: string;

    private uri: string = 'http://localhost:8888';
    private numSendHeaders = 1;
    private sendHeaders: Array<Object> = [{}];

    private deviceCommands: Array<string> = ['Device', 'enumerate'];
    private dcCommands: Array<string> = ['DC', 'getVoltage', 'setVoltage'];
    private oscCommands: Array<string> = ['OSC', 'read', 'setParameters'];
    private triggerCommands: Array<string> = ['Trigger', 'forceTrigger', 'read', 'run', 'single', 'setParameters', 'stop'];

    private sendBody: string = '';

    private responseHeaders: Array<string> = [];

    private responseBody: string = '';
    private formattedResponseBody: string = '';

    private responseBodyFormats: Array<string> = ["raw", "json", "osjb"];
    private selectedRepsonseBodyFormat: string;

    constructor() {
        console.log('ProtocolTestPanel Constructor');
        //this.transport = new HttpTransportComponent('');
        this.selectedHttpMethod = this.httpMethodNames[0];
        this.selectedRepsonseBodyFormat = this.responseBodyFormats[0];
    }

    onValueChange(data) {
        this.selectedHttpMethod = data.value;
    }

    onResponseBodyFormatChange(data) {
        this.formatResponse(data.value);
    }

    formatResponse(format: string) {
        try {
            switch (format) {
                case "json":
                    let tempJson = JSON.parse(this.responseBody);
                    this.formattedResponseBody = JSON.stringify(tempJson, undefined, 4);
                    break;
                case "osjb":
                this.responseBody                    
                    let binaryIndexStringLength = this.responseBody.indexOf('\r\n');
                    let binaryIndex = parseFloat(this.responseBody.substring(0, binaryIndexStringLength));
                    let command = JSON.parse(this.responseBody.substring(binaryIndexStringLength + 2, binaryIndex));
                    this.formattedResponseBody = command;
                    break;
                case "raw":
                    this.formattedResponseBody = this.responseBody;
                    break;
                default:
                    break;
            }
        }
        catch (err) {
            if (format == "json") {
                this.formattedResponseBody = "Response Is Not Invalid JSON";
            }
        }
    }

    addHeader() {
        this.sendHeaders.push({
            "key": "",
            "value": ""
        });
        this.numSendHeaders++;
    }

    removeHeader(index: number) {
        this.sendHeaders.splice(index, 1);
        this.numSendHeaders--;
    }

    onDeviceCommandChange(data) {
        switch (data.value) {
            case "enumerate":
                this.sendBody = JSON.stringify(this.commands.device.enumerate);
                break;
            default:
                this.sendBody = "";
                break;
        }
    }

    onDcCommandChange(data) {
        switch (data.value) {
            case "getVoltage":
                this.sendBody = JSON.stringify(this.commands.dc.getVoltage);
                break;
            case "setVoltage":
                this.sendBody = JSON.stringify(this.commands.dc.setVoltage);
                break;
            default:
                this.sendBody = "";
                break;
        }
    }

    onOscCommandChange(data) {
        switch (data.value) {
            case "read":
                this.sendBody = JSON.stringify(this.commands.osc.read);
                break;
            case "setParameters":
                this.sendBody = JSON.stringify(this.commands.osc.setParameters);
                break;
            default:
                this.sendBody = "";
                break;
        }
    }

    onTriggerCommandChange(data) {
        switch (data.value) {
            case "forceTrigger":
                this.sendBody = JSON.stringify(this.commands.trigger.forceTrigger);
                break;
            case "setParameters":
                this.sendBody = JSON.stringify(this.commands.trigger.setParameters);
                break;
            case "read":
                this.sendBody = JSON.stringify(this.commands.trigger.read);
                break;
            case "run":
                this.sendBody = JSON.stringify(this.commands.trigger.run);
                break;
            case "single":
                this.sendBody = JSON.stringify(this.commands.trigger.single);
                break;
            case "stop":
                this.sendBody = JSON.stringify(this.commands.trigger.stop);
                break;
            default:
                this.sendBody = "";
                break;
        }
    }

    send() {

        //Clear Previous Response
        this.responseBody = '';
        this.formatResponse('raw');

        let XHR = new XMLHttpRequest();

        //Callback on successful response
        XHR.addEventListener("load", function (event) {
            //Populate response headers
            let responseHeaders = XHR.getAllResponseHeaders().split("\n");
            responseHeaders.forEach((element: string, index) => {
                if (element != '' && element != undefined) {
                    let tokens = element.split(':');
                    this.responseHeaders[index] = {
                        'key': tokens[0].trim(),
                        'value': tokens[1].trim()
                    }
                }
            });
            console.log('Response Headers ', responseHeaders);

            //Parse Response
            this.responseBody = String.fromCharCode.apply(null, new Int8Array(event.currentTarget.response));
            this.formatResponse(this.selectedRepsonseBodyFormat);
        }.bind(this));

        //Callback on error
        XHR.addEventListener("error", function (event) {
            this.responseBody = "Device did not respond.  Check the console for more information";
            this.formatResponse(this.selectedRepsonseBodyFormat);
        }.bind(this));

        XHR.open("POST", this.uri);
        //Set resposne type as arraybuffer to receive response as bytes
        XHR.responseType = 'arraybuffer';

        //Add Headers To Send
        this.sendHeaders.forEach((element: any) => {
            if (element.key != '' && element.key != undefined) {
                XHR.setRequestHeader(element.key, element.value);
                console.log('adding header: ', element, ' ', element.key, '::', element.value);
            }
        })

        XHR.send(this.sendBody);
    }



    private commands =
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
        "dc": {
            "getVoltage": {
                "dc": {
                    "0": [
                        {
                            "command": "getVoltage"
                        }
                    ]
                }
            },
            "setVoltage": {
                "dc": {
                    "0": [
                        {
                            "command": "setVoltage",
                            "voltage": 3300
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
                            "acqCount": 27
                        }
                    ],
                    "2": [
                        {
                            "command": "read",
                            "acqCount": 27
                        }
                    ]
                }
            },
            "setParameters": {
                "osc": {
                    "1": [
                        {
                            "command": "setParameters",
                            "offset": 3000,
                            "gain": 0.75
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
                                "lowerThreshold": 3300,
                                "upperThreshold": 4000
                            },
                            "targets": {
                                "osc": [
                                    1,
                                    2
                                ],
                                "la": [
                                    1,
                                    2
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
}