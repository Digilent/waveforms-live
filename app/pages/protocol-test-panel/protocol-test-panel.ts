import {Component} from '@angular/core';
import {CHART_DIRECTIVES} from 'angular2-highcharts';
import {ModalController, NavParams, ViewController, Platform} from 'ionic-angular';

//Components
import {TransportComponent} from '../../components/transport/transport.component';
import {HttpTransportComponent} from '../../components/transport/http-transport.component';
import {DropDownMenu} from '../../libs/digilent-ionic2-utilities/drop-down-menu/drop-down-menu.component';

//Services
import {StorageService} from '../../services/storage/storage.service';

@Component({
    templateUrl: 'build/pages/protocol-test-panel/protocol-test-panel.html',
    directives: [DropDownMenu]
})

export class ProtocolTestPanel {

    private transport: TransportComponent;
    private storage: StorageService;


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

    private rawResponse: ArrayBuffer;
    private responseBody: string = '';
    private formattedResponseBody: string = '';
    private responseBinaryString: string = '';
    private formattedResponseBinaryString: string = '';

    private responseBodyFormats: Array<string> = ["raw", "json", "osjb"];
    private selectedRepsonseBodyFormat: string;

    private responseRawBinary: ArrayBuffer;
    private responseBinaryFormats: Array<string> = ['u8', 'i8', 'u16', 'i16'];
    private selectedRepsonseBinaryFormat: string;

    private modalCtrl: ModalController;

    constructor(_storage: StorageService, _modalCtrl: ModalController) {
        console.log('ProtocolTestPanel Constructor');
        this.modalCtrl = _modalCtrl;
        this.storage = _storage;
        //this.transport = new HttpTransportComponent('');
        this.selectedHttpMethod = this.httpMethodNames[0];
        this.selectedRepsonseBodyFormat = this.responseBodyFormats[0];
        this.selectedRepsonseBinaryFormat = this.responseBinaryFormats[0];

        //Load Saved Values
        this.storage.getData('uri').then((value) => {
            this.uri = value;
        });
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
                break;
            case "setVoltage":
                this.sendBody = JSON.stringify(this.commands.dc.setVoltage);
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
                break;
            case "setParameters":
                this.sendBody = JSON.stringify(this.commands.osc.setParameters);
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

    //Send the specified header/body to the specified URL
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

            //Parse Response            
            this.rawResponse = event.currentTarget.response;
            this.responseBody = String.fromCharCode.apply(null, new Int8Array(this.rawResponse));
            this.formatResponse(this.selectedRepsonseBodyFormat);
        }.bind(this));

        //Callback on error
        XHR.addEventListener("error", function (event) {
            this.responseBody = "Device did not respond.  Check the console for more information";
            this.formatResponse(this.selectedRepsonseBodyFormat);
        }.bind(this));

        XHR.open(this.selectedHttpMethod, this.uri);

        //Set resposne type as arraybuffer to receive response as bytes
        XHR.responseType = 'arraybuffer';

        //Add Headers To Send
        this.sendHeaders.forEach((element: any) => {
            if (element.key != '' && element.key != undefined) {
                XHR.setRequestHeader(element.key, element.value);                
            }
        })

        XHR.send(this.sendBody);
    }

    //Callback called when uri input changes
    onUrlInputChange(data) {
        //Store value in local storage to load on next init
        this.storage.saveData('uri', data);
    }

    //---------- OpenScope Command Templates ----------
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

    chartData() {
        let dataArray = new Int16Array(this.responseRawBinary, 0, 8000);
        let untypedArray = Array.prototype.slice.call(dataArray);
        let modal = this.modalCtrl.create(ChartModal, {
            dataToDisplay: untypedArray
        });
        modal.onDidDismiss(data=> {
            console.log('dismiss');
        });
        modal.present();
    }
}

@Component({
    template: `
    <div class="chart-component-wrapper" style="background-color:silver;display:block;width:100%;height:600px;">
        <chart [options]="options" (load)="chartLoad($event.context)"></chart>
    </div>
  `,
  directives: [CHART_DIRECTIVES]
})
export class ChartModal {
    private platform: Platform;
    private viewCtrl: ViewController;
    private params: NavParams;
    
    private data: number[];
    public chart: Object;
    private options: Object;

    constructor(
        _platform: Platform,
        _viewCtrl: ViewController,
        _params: NavParams
    ) {
        this.platform = _platform;
        this.viewCtrl = _viewCtrl;
        this.params = _params;
        this.data = this.params.get('dataToDisplay');
        this.options = {
            chart: {
                type: 'line',
                zoomType: 'x',
                animation: false,
                spacingTop: 20
            },
            title: {
                text: ''
            },
            tooltip: {
                enabled: true
            },
            series: [{
                data: [29.9, 36, 47, 57, 67, 71.5, 82, 92, 102, 106.4, 110, 120, 129.2],
                allowPointSelect: true
            }],
            legend: {
                enabled: false
            },
            yAxis: [{
                gridLineWidth: 1,
                tickPositioner: function () {
                    let numTicks = 11;
                    let ticks = [];
                    let min = this.chart.yAxis[0].min;
                    let max = this.chart.yAxis[0].max;
                    let delta = (max - min) / (numTicks - 1);
                    for (var i = 0; i < numTicks; i++) {
                        ticks[i] = (min + i * delta).toFixed(3);
                    }
                    return ticks;
                },
                title: {
                    text: 'Series 1'
                }
            }],
            plotOptions: {
                series: {
                    pointInterval: 1,
                    pointStart: 0,
                    stickyTracking: false
                }
            },
            credits: {
                enabled: false
            },
            xAxis: {
                minRange: 0.000000001,
                startOnTick: true,
                endOnTick: true,

                gridLineWidth: 1,
                minorGridLineWidth: 0,

                tickPositioner: function () {
                    let numTicks = 11;
                    let ticks = [];
                    let min = this.chart.xAxis[0].min;
                    let max = this.chart.xAxis[0].max;
                    let delta = (max - min) / (numTicks - 1);
                    let mult = 3;
                    if (delta < .001) {
                        let exp = delta.toExponential(3);
                        let real1 = exp.slice(exp.indexOf('e') - exp.length + 1);
                        mult = -1 * Number(real1) + 3;
                        if (mult > 20) {
                            mult = 20;
                        }
                    }
                    for (var i = 0; i < numTicks; i++) {
                        ticks[i] = (min + i * delta).toFixed(mult); 
                    }
                    return ticks;
                },

                minorTickInterval: 'auto',
                minorTickLength: 10,
                minorTickWidth: 1,
                minorTickPosition: 'inside',

            }
        };
    }

    chartLoad(chart) {
        console.log(chart);
        this.chart = chart;
        this.chart.reflow();
        this.chart.series[0].setData(this.data, false, false, false);
        this.chart.redraw(false);
    }

    close() {
        this.viewCtrl.dismiss();
    }
}