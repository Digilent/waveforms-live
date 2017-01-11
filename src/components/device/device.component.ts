import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import 'rxjs/Rx';

//Components
import { AwgInstrumentComponent } from '../instruments/awg/awg-instrument.component';
import { DcInstrumentComponent } from '../instruments/dc/dc-instrument.component';
import { LaInstrumentComponent } from '../instruments/la/la-instrument.component';
import { OscInstrumentComponent } from '../instruments/osc/osc-instrument.component';
import { TriggerInstrumentComponent } from '../instruments/trigger/trigger-instrument.component';
import { GpioInstrumentComponent } from '../instruments/gpio/gpio-instrument.component';

//Services
import { TransportService } from '../../services/transport/transport.service';

@Injectable()
export class DeviceComponent {

    public transport: TransportService;
    public descriptorObject: any;
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

        this.descriptorObject = deviceDescriptor;
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
            console.log('multicommand: ');
            console.log(commandToBeSent);
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
                            console.log(String.fromCharCode.apply(null, new Int8Array(arrayBuffer.slice(0))));
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
                                        if (responseObject.statusCode > 0) {
                                            console.log('StatusCode Error!');
                                            observer.error(responseObject);
                                            flag = true;
                                        }
                                        observer.next(this.instruments[instrument][responseObject.command + 'Parse'](channel, responseObject));
                                    }
                                    catch (e) {
                                        console.log(e);
                                        flag = true;
                                        observer.error('Error in multiCommand().\nThis is most likely due to an undefined function.\nUnknown function name is: ' + responseObject.command + 'Parse.\nAuto-generated error: ' + e);
                                    }
                                    if (flag) { return; }
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

    _genericResponseHandler(commandObject: Object): Observable<any> {
        return Observable.create((observer) => {
            this.transport.writeRead('/', JSON.stringify(commandObject), 'json').subscribe(
                (arrayBuffer) => {
                    let data = JSON.parse(String.fromCharCode.apply(null, new Int8Array(arrayBuffer.slice(0))));
                    if (data.device == undefined || data.device[0].statusCode > 0 || data.agent != undefined) {
                        observer.error(data);
                        return;
                    }
                    observer.next(data);
                    //Handle device errors and warnings
                    observer.complete();
                },
                (err) => {
                    observer.error(err);
                },
                () => {
                    observer.complete();
                }
            )
        });
    }

    storageGetLocations(): Observable<any> {
        let command = {
            "device": [{
                command: "storageGetLocations"
            }]
        }
        return this._genericResponseHandler(command);
    }

    calibrationGetInstructions(): Observable<any> {
        let command = {
            "device": [{
                command: "calibrationGetInstructions"
            }]
        }
        return this._genericResponseHandler(command);
    }

    calibrationStart(): Observable<any> {
        let command = {
            "device": [{
                command: "calibrationStart"
            }]
        }
        return this._genericResponseHandler(command);
    }

    calibrationLoad(location: string, fileName: string): Observable<any> {
        let command = {
            "device": [{
                "command": "calibrationLoad",
                "location": location,
                "name": fileName
            }]
        }
        return this._genericResponseHandler(command);
    }

    calibrationRead(): Observable<any> {
        let commandObject = {
            "device": [{
                command: "calibrationRead"
            }]
        }
        return Observable.create((observer) => {
            this.transport.writeRead('/', JSON.stringify(commandObject), 'json').subscribe(
                (data) => {
                    console.log('response');
                    let count = 0;
                    let i = 0;
                    let stringBuffer = '';
                    while (count < 2 && i < 2000) {
                        let char = '';
                        char += String.fromCharCode.apply(null, new Int8Array(data.slice(i, i + 1)));
                        if (char === '\n') {
                            count++;
                        }
                        stringBuffer += char;
                        i++;
                    }
                    if (i === 2000) {
                        console.log(stringBuffer);
                        observer.error('Calibration Read Failed. Try Again');
                        return;
                    }
                    let binaryIndexStringLength = stringBuffer.indexOf('\r\n');
                    let binaryIndex = parseFloat(stringBuffer.substring(0, binaryIndexStringLength));
                    let command;
                    try {
                        command = JSON.parse(stringBuffer.substring(binaryIndexStringLength + 2, binaryIndexStringLength + binaryIndex + 2));
                    }
                    catch (error) {
                        console.log(error);
                        console.log('Error parsing response from read. Printing entire response');
                        console.log(String.fromCharCode.apply(null, new Int8Array(data.slice(0))));
                        observer.error(error);
                        observer.complete();
                        return;
                    }
                    console.log(command);
                    let binaryData = new Int16Array(data.slice(binaryIndexStringLength + 2 + binaryIndex));
                    observer.next(command);
                    //Handle device errors and warnings
                    observer.complete();
                },
                (err) => {
                    observer.error(err);
                },
                () => {
                    observer.complete();
                }
            )
        });
    }

    calibrationSave(location: string): Observable<any> {
        let command = {
            "device": [{
                "command": "calibrationSave",
                "location": location
            }]
        }
        return this._genericResponseHandler(command);
    }

    calibrationGetStatus(): Observable<any> {
        let command = {
            "device": [{
                "command": "calibrationGetStatus"
            }]
        }
        return this._genericResponseHandler(command);
    }

    nicList(): Observable<any> {
        let command = {
            "device": [{
                command: "nicList"
            }]
        }
        return this._genericResponseHandler(command);
    }

    nicGetStatus(adapter: string): Observable<any> {
        let command = {
            "device": [{
                command: "nicGetStatus",
                adapter: adapter
            }]
        }
        return this._genericResponseHandler(command);
    }

    wifiScan(adapter: string): Observable<any> {
        let command = {
            "device": [{
                command: "wifiScan",
                adapter: adapter
            }]
        }
        return this._genericResponseHandler(command);
    }

    wifiReadScannedNetworks(adapter: string): Observable<any> {
        let command = {
            "device": [{
                command: "wifiReadScannedNetworks",
                adapter: adapter
            }]
        }
        return this._genericResponseHandler(command);
    }

    wifiSetParameters(ssid: string, securityType: string, passphraseOrKey: string, wepKeys: string[], wepKeyIndex: number, autoConnect: boolean): Observable<any> {
        let command = {
            "device": [{
                "command": "wifiSetParameters",
                "ssid": ssid,
                "securityType": securityType,
                "passphraseOrKey": passphraseOrKey,
                "wepKeys": wepKeys,
                "wepKeyIndex": wepKeyIndex,
                "autoConnect": autoConnect
            }]
        }
        return this._genericResponseHandler(command);
    }

    wifiListSavedNetworks(adapter: string): Observable<any> {
        let command = {
            "device": [{
                command: "wifiListSavedNetworks",
                adapter: adapter
            }]
        }
        return this._genericResponseHandler(command);
    }

    wifiDeleteNetwork(ssid: string): Observable<any> {
        let command = {
            "device": [{
                command: "wifiDeleteNetwork",
                ssid: ssid
            }]
        }
        return this._genericResponseHandler(command);
    }

    networkConnect(adapter: string, ssid: string): Observable<any> {
        let command = {
            "device": [{
                command: "networkConnect",
                adapter: adapter,
                ssid: ssid
            }]
        }
        return this._genericResponseHandler(command);
    }

    wifiDisconnect(adapter: string): Observable<any> {
        let command = {
            "device": [{
                command: "wifiDisconnect",
                adapter: adapter
            }]
        }
        return this._genericResponseHandler(command);
    }

    wifiSaveNetwork(ssid: string): Observable<any> {
        let command = {
            "device": [{
                command: "wifiSaveNetwork",
                ssid: ssid
            }]
        }
        return this._genericResponseHandler(command);
    }

    wifiLoadNetwork(ssid: string): Observable<any> {
        let command = {
            "device": [{
                command: "wifiLoadNetwork",
                ssid: ssid
            }]
        }
        return this._genericResponseHandler(command);
    }

}