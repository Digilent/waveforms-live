import {Injectable} from '@angular/core';
import {Observable} from 'rxjs/Observable';
import 'rxjs/Rx';

//Components
import {AwgInstrumentComponent} from '../instruments/awg/awg-instrument.component';
import {DcInstrumentComponent} from '../instruments/dc/dc-instrument.component';
import {LaInstrumentComponent} from '../instruments/la/la-instrument.component';
import {OscInstrumentComponent} from '../instruments/osc/osc-instrument.component';
import {TriggerInstrumentComponent} from '../instruments/trigger/trigger-instrument.component';
import {GpioInstrumentComponent} from '../instruments/gpio/gpio-instrument.component';

//Services
import {TransportService} from '../../services/transport/transport.service';

@Injectable()
export class DeviceComponent {

    public transport: TransportService;

    public rootUri: string;
    public deviceMake: string;
    public deviceModel: string;
    public firmwareVersion;
    public instruments: {
        awg: AwgInstrumentComponent,
        dc: DcInstrumentComponent,
        la: LaInstrumentComponent,
        osc: OscInstrumentComponent,
        trigger: TriggerInstrumentComponent,
        gpio: GpioInstrumentComponent
    } = {
        awg: null,
        dc: null,
        la: null,
        osc: null,
        trigger: null,
        gpio: null
    };

    constructor(_rootUri: string, deviceDescriptor: any) {
        console.log('Device Contructor');
        //TODO If deviceDescriptor is empty, attempt to enumerate the deviceDescriptor [?]

        this.rootUri = _rootUri;
        this.transport = new TransportService(this.rootUri);
        if (_rootUri === 'local') {
            this.transport.setLocalTransport(deviceDescriptor);
        }
        console.log(deviceDescriptor);
        this.deviceMake = deviceDescriptor.deviceMake;
        this.deviceModel = deviceDescriptor.deviceModel;
        this.firmwareVersion = deviceDescriptor.firmwareVersion;
        this.instruments.awg = new AwgInstrumentComponent(this.transport, deviceDescriptor.awg);
        this.instruments.dc = new DcInstrumentComponent(this.transport, deviceDescriptor.dc);
        this.instruments.la = new LaInstrumentComponent(this.transport, deviceDescriptor.la);
        this.instruments.osc = new OscInstrumentComponent(this.transport, deviceDescriptor.osc);
        this.instruments.trigger = new TriggerInstrumentComponent(this.transport, 'deviceDescriptor.trigger');
        this.instruments.gpio = new GpioInstrumentComponent(this.transport, deviceDescriptor.gpio);
    }

    multiCommand(commandObject: any): Observable<any> {
        let commandToBeSent = {

        }
        return Observable.create((observer) => {
            for (let instrument in commandObject) {
                commandToBeSent[instrument] = {};
                let functionNames = Object.keys(commandObject[instrument]);
                let flag = false;
                    for (let element of functionNames) {
                        let responseJson;
                        try {
                            responseJson = this.instruments[instrument][element + 'Json'](...commandObject[instrument][element]);
                        }
                        catch (e) {
                            console.log(e);
                            flag = true;
                            observer.error('Error in multiCommand().\nThis is most likely due to an undefined function.\nUnknown function name is: ' + element + 'Json.\nAuto-generated error: ' + e);
                        }
                        if (flag) {
                            return;
                        }
                        for (let channel in responseJson[instrument]) {
                            if (commandToBeSent[instrument][channel] === undefined) {
                                commandToBeSent[instrument][channel] = [];
                                commandToBeSent[instrument][channel] = responseJson[instrument][channel];
                            }
                            else {
                                commandToBeSent[instrument][channel].push(responseJson[instrument][channel][0]);
                            }
                        }
                    }
            }
            //MultiCommand packet is complete. Now to send
            let multiCommandResponse;
            this.transport.writeRead('/', JSON.stringify(commandToBeSent), 'json').subscribe(
                (arrayBuffer) => {
                    let firstChar = String.fromCharCode.apply(null, new Int8Array(arrayBuffer.slice(0, 1)));
                    if (!isNaN(parseInt(firstChar))) {
                        //OSJB
                        //console.log('OSJB');

                        let count = 0;
                        let i = 0;
                        let stringBuffer = '';
                        while (count < 2 && i < 10000) {
                            let char = '';
                            char += String.fromCharCode.apply(null, new Int8Array(arrayBuffer.slice(i, i + 1)));
                            if (char === '\n') {
                                count++;
                            }
                            stringBuffer += char;
                            i++;
                        }
                        let binaryIndexStringLength = stringBuffer.indexOf('\r\n');
                        let binaryIndex = parseFloat(stringBuffer.substring(0, binaryIndexStringLength));
                        let command;
                        let binaryData;
                        try {
                            command = JSON.parse(stringBuffer.substring(binaryIndexStringLength + 2, binaryIndexStringLength + binaryIndex + 2));
                            binaryData = arrayBuffer.slice(binaryIndexStringLength + 2 + binaryIndex);
                        }
                        catch (error) {
                            console.log(error);
                            console.log('Error parsing OSJB response. Printing entire response');
                            console.log(String.fromCharCode.apply(null, new Int8Array(arrayBuffer.slice(0))));
                            observer.error(error);
                            return;
                        }
                        //console.log('command parsed. Now calling individual parsing functions');
                        let flag = false;
                        for (let instrument in command) {
                            for (let channel in command[instrument]) {
                                for (let responseObject of command[instrument][channel]) {
                                    try {
                                        if (responseObject.command === 'read') {
                                            console.log(responseObject);
                                            observer.next(this.instruments[instrument][responseObject.command + 'Parse'](channel, command, binaryData));
                                        }
                                        else {
                                            observer.next(this.instruments[instrument][responseObject.command + 'Parse'](channel, responseObject));
                                        }
                                    }
                                    catch (e) {
                                        console.log(e);
                                        flag = true;
                                        observer.error('Error in multiCommand().\nThis is most likely due to an undefined function.\nUnknown function name is: ' + responseObject.command + 'Parse.\nAuto-generated error: ' + e);
                                    }
                                    if (flag) return;
                                }
                            }
                        }
                        observer.next('OSJB whaddup');
                        observer.complete();
                    }
                    else if (firstChar === '{') {
                        //JSON
                        //console.log('JSON');
                        try {
                            multiCommandResponse = JSON.parse(String.fromCharCode.apply(null, new Int8Array(arrayBuffer.slice(0))));
                        }
                        catch (e) {
                            console.log(e);
                            observer.error('Error in multiCommand().\nThis is most likely due to an unparseable response.\nAuto-generated error: ' + e);
                        }
                        //Response Received! Now to reparse and call observer.next for each command
                        let flag = false;
                        for (let instrument in multiCommandResponse) {
                            for (let channel in multiCommandResponse[instrument]) {
                                for (let responseObject of multiCommandResponse[instrument][channel]) {
                                    try {
                                        observer.next(this.instruments[instrument][responseObject.command + 'Parse'](channel, responseObject));
                                    }
                                    catch (e) {
                                        console.log(e);
                                        flag = true;
                                        observer.error('Error in multiCommand().\nThis is most likely due to an undefined function.\nUnknown function name is: ' + responseObject.command + 'Parse.\nAuto-generated error: ' + e);
                                    }
                                    if (flag) return;
                                }
                            }
                        }
                        observer.complete();
                    }
                    else {
                        observer.error('Error in multiCommand().\nThis is most likely due to an unrecognized response format. Exiting');
                    }
                },
                (err) => {
                    console.log(err);
                },
                () => {
                    
                }
            );
            
        });
        
    }


}